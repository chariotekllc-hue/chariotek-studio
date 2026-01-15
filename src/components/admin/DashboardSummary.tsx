'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  LayoutDashboard,
  Users,
  FileEdit,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAdminRole } from '@/hooks/use-admin-role';
import { getAuditLogger } from '@/lib/cms/audit-logger';
import { AuditLog, AuditAction, AdminUser } from '@/lib/cms/types';
import { getRoleDisplayName, getRoleBadgeClass } from '@/lib/cms/rbac';
import { AuditLogViewer } from './AuditLogViewer';
import { collection } from 'firebase/firestore';
import Link from 'next/link';

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="h-4 w-4 text-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// RECENT ACTIVITY ITEM
// =============================================================================

interface ActivityItemProps {
  log: AuditLog;
}

function ActivityItem({ log }: ActivityItemProps) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      [AuditAction.LOGIN]: 'logged in',
      [AuditAction.LOGOUT]: 'logged out',
      [AuditAction.CONTENT_UPDATE]: 'updated content',
      [AuditAction.CONTENT_CREATE]: 'created content',
      [AuditAction.CONTENT_DELETE]: 'deleted content',
      [AuditAction.CONTENT_ROLLBACK]: 'rolled back content',
      [AuditAction.ADMIN_CREATE]: 'added an admin',
      [AuditAction.ADMIN_DELETE]: 'removed an admin',
      [AuditAction.ADMIN_ROLE_CHANGE]: 'changed a role',
    };
    return labels[action] || action;
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`
        w-2 h-2 rounded-full mt-2 shrink-0
        ${log.success ? 'bg-green-500' : 'bg-red-500'}
      `} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium">{log.userEmail}</span>
          {' '}
          <span className="text-muted-foreground">{getActionLabel(log.action)}</span>
          {log.resourceType && (
            <span className="text-muted-foreground"> ({log.resourceType})</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// ADMIN USER LIST ITEM
// =============================================================================

interface AdminListItemProps {
  admin: AdminUser;
  isCurrentUser: boolean;
}

function AdminListItem({ admin, isCurrentUser }: AdminListItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            {admin.email}
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">You</Badge>
            )}
          </p>
          {admin.displayName && (
            <p className="text-xs text-muted-foreground">{admin.displayName}</p>
          )}
        </div>
      </div>
      <Badge className={`text-xs ${getRoleBadgeClass(admin.role)}`}>
        {getRoleDisplayName(admin.role)}
      </Badge>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export function DashboardSummary() {
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [stats, setStats] = useState({
    totalEdits: 0,
    editsTrend: '',
  });

  const firestore = useFirestore();
  const { user, role, roleDisplayName, canViewAuditLogs, isSuperAdmin, canManageAdmins } = useAdminRole();
  
  // Fetch admin users
  const adminUsersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'adminUsers') : null),
    [firestore]
  );
  const { data: adminUsers, isLoading: isLoadingAdmins } = useCollection<AdminUser>(adminUsersRef);

  // Fetch recent activity
  useEffect(() => {
    async function fetchActivity() {
      if (!firestore || !canViewAuditLogs) {
        setIsLoadingActivity(false);
        return;
      }

      try {
        const auditLogger = getAuditLogger(firestore);
        const result = await auditLogger.query({ limit: 10 });
        setRecentActivity(result.items);
        
        // Calculate edit stats
        const edits = result.items.filter(
          log => log.action.startsWith('content_')
        ).length;
        setStats({
          totalEdits: edits,
          editsTrend: edits > 5 ? 'High activity today' : 'Normal activity',
        });
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setIsLoadingActivity(false);
      }
    }

    fetchActivity();
  }, [firestore, canViewAuditLogs]);

  const activeAdmins = adminUsers?.filter(a => a.isActive) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.01em]">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          Logged in as{' '}
          <span className="font-medium text-foreground">{user?.email}</span>
          <Badge className={`${getRoleBadgeClass(role!)}`}>
            {roleDisplayName}
          </Badge>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Admins"
          value={activeAdmins.length}
          description="Users with access"
          icon={Users}
          isLoading={isLoadingAdmins}
        />
        <StatCard
          title="Your Role"
          value={roleDisplayName}
          description={isSuperAdmin ? 'Full system access' : 'Limited access'}
          icon={Shield}
        />
        <StatCard
          title="Recent Edits"
          value={stats.totalEdits}
          description={stats.editsTrend}
          icon={FileEdit}
          trend="up"
          isLoading={isLoadingActivity}
        />
        <StatCard
          title="System Status"
          value="Healthy"
          description="All systems operational"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions across the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-2 w-2 rounded-full mt-2" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !canViewAuditLogs ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Shield className="h-4 w-4" />
                <p className="text-sm">Activity logs require admin permissions</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recent activity</p>
            ) : (
              <div className="divide-y divide-border">
                {recentActivity.slice(0, 5).map(log => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Users
            </CardTitle>
            <CardDescription>
              {activeAdmins.length} active administrator{activeAdmins.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAdmins ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeAdmins.slice(0, 5).map(admin => (
                  <AdminListItem
                    key={admin.id}
                    admin={admin}
                    isCurrentUser={admin.id === user?.id}
                  />
                ))}
              </div>
            )}
            
            {canManageAdmins && (
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="#" onClick={() => {}}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileEdit className="h-5 w-5" />
              <span>Edit Home Page</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Eye className="h-5 w-5" />
              <span>View Site</span>
            </Button>
            {canManageAdmins && (
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Add Admin</span>
              </Button>
            )}
            {canViewAuditLogs && (
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Activity className="h-5 w-5" />
                <span>View All Logs</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Activity Log (for admins) */}
      {canViewAuditLogs && (
        <AuditLogViewer
          title="Full Activity Log"
          description="Complete audit trail of all admin actions"
          maxHeight="400px"
        />
      )}
    </div>
  );
}

export default DashboardSummary;
