'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FileText,
  User,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  FileEdit,
  Trash2,
  RotateCcw,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useFirestore } from '@/firebase';
import { useAdminRole } from '@/hooks/use-admin-role';
import { getAuditLogger, AuditLogQuery } from '@/lib/cms/audit-logger';
import { AuditLog, AuditAction, AuditActionType } from '@/lib/cms/types';
import { getRoleDisplayName, getRoleBadgeClass } from '@/lib/cms/rbac';

// =============================================================================
// CONSTANTS
// =============================================================================

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [AuditAction.LOGIN]: LogIn,
  [AuditAction.LOGOUT]: LogOut,
  [AuditAction.LOGIN_FAILED]: LogIn,
  [AuditAction.CONTENT_CREATE]: FileEdit,
  [AuditAction.CONTENT_UPDATE]: FileEdit,
  [AuditAction.CONTENT_DELETE]: Trash2,
  [AuditAction.CONTENT_PUBLISH]: CheckCircle2,
  [AuditAction.CONTENT_UNPUBLISH]: XCircle,
  [AuditAction.CONTENT_ROLLBACK]: RotateCcw,
  [AuditAction.ADMIN_CREATE]: UserPlus,
  [AuditAction.ADMIN_UPDATE]: User,
  [AuditAction.ADMIN_DELETE]: UserMinus,
  [AuditAction.ADMIN_ROLE_CHANGE]: Shield,
  [AuditAction.SETTINGS_UPDATE]: Settings,
};

const ACTION_LABELS: Record<string, string> = {
  [AuditAction.LOGIN]: 'Login',
  [AuditAction.LOGOUT]: 'Logout',
  [AuditAction.LOGIN_FAILED]: 'Login Failed',
  [AuditAction.CONTENT_CREATE]: 'Content Created',
  [AuditAction.CONTENT_UPDATE]: 'Content Updated',
  [AuditAction.CONTENT_DELETE]: 'Content Deleted',
  [AuditAction.CONTENT_PUBLISH]: 'Content Published',
  [AuditAction.CONTENT_UNPUBLISH]: 'Content Unpublished',
  [AuditAction.CONTENT_ROLLBACK]: 'Content Rollback',
  [AuditAction.ADMIN_CREATE]: 'Admin Added',
  [AuditAction.ADMIN_UPDATE]: 'Admin Updated',
  [AuditAction.ADMIN_DELETE]: 'Admin Removed',
  [AuditAction.ADMIN_ROLE_CHANGE]: 'Role Changed',
  [AuditAction.SETTINGS_UPDATE]: 'Settings Updated',
};

const ACTION_COLORS: Record<string, string> = {
  [AuditAction.LOGIN]: 'text-green-600 bg-green-50 dark:bg-green-950',
  [AuditAction.LOGOUT]: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
  [AuditAction.LOGIN_FAILED]: 'text-red-600 bg-red-50 dark:bg-red-950',
  [AuditAction.CONTENT_CREATE]: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  [AuditAction.CONTENT_UPDATE]: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  [AuditAction.CONTENT_DELETE]: 'text-red-600 bg-red-50 dark:bg-red-950',
  [AuditAction.CONTENT_PUBLISH]: 'text-green-600 bg-green-50 dark:bg-green-950',
  [AuditAction.CONTENT_UNPUBLISH]: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  [AuditAction.CONTENT_ROLLBACK]: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  [AuditAction.ADMIN_CREATE]: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  [AuditAction.ADMIN_UPDATE]: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  [AuditAction.ADMIN_DELETE]: 'text-red-600 bg-red-50 dark:bg-red-950',
  [AuditAction.ADMIN_ROLE_CHANGE]: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  [AuditAction.SETTINGS_UPDATE]: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
};

// =============================================================================
// TYPES
// =============================================================================

interface AuditLogViewerProps {
  title?: string;
  description?: string;
  initialFilter?: AuditLogQuery;
  showFilters?: boolean;
  maxHeight?: string;
}

// =============================================================================
// AUDIT LOG ITEM COMPONENT
// =============================================================================

interface AuditLogItemProps {
  log: AuditLog;
}

function AuditLogItem({ log }: AuditLogItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const IconComponent = ACTION_ICONS[log.action] || FileText;
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const actionColor = ACTION_COLORS[log.action] || 'text-gray-600 bg-gray-50';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="
            w-full text-left
            p-4 rounded-xl
            border border-border
            bg-card
            hover:bg-muted/50
            transition-all duration-200
            group
          "
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${actionColor}`}>
              <IconComponent className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {actionLabel}
                </span>
                
                {/* Success/Failure badge */}
                {log.success ? (
                  <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                    Success
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                    Failed
                  </Badge>
                )}

                {/* Resource type badge */}
                {log.resourceType && (
                  <Badge variant="secondary" className="text-xs">
                    {log.resourceType}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {log.userEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Expand indicator */}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2">
        <Card className="bg-muted/30 ml-14">
          <CardContent className="p-4 space-y-4 text-sm">
            {/* Timestamp */}
            <div>
              <span className="font-medium text-foreground">Timestamp: </span>
              <span className="text-muted-foreground">
                {format(log.timestamp, 'PPpp')}
              </span>
            </div>

            {/* User info */}
            <div>
              <span className="font-medium text-foreground">User: </span>
              <span className="text-muted-foreground">
                {log.userEmail} ({log.userId})
              </span>
            </div>

            {/* Role */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Role: </span>
              <Badge className={`text-xs ${getRoleBadgeClass(log.userRole as any)}`}>
                {getRoleDisplayName(log.userRole as any)}
              </Badge>
            </div>

            {/* Resource path */}
            {log.resourcePath && (
              <div>
                <span className="font-medium text-foreground">Resource: </span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {log.resourcePath}
                </code>
              </div>
            )}

            {/* Error message */}
            {log.errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-1 text-red-600 dark:text-red-400">
                  {log.errorMessage}
                </p>
              </div>
            )}

            {/* Previous value (collapsed) */}
            {log.previousValue && Object.keys(log.previousValue).length > 0 && (
              <div>
                <span className="font-medium text-foreground">Previous Value:</span>
                <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-32">
                  {JSON.stringify(log.previousValue, null, 2)}
                </pre>
              </div>
            )}

            {/* New value (collapsed) */}
            {log.newValue && Object.keys(log.newValue).length > 0 && (
              <div>
                <span className="font-medium text-foreground">New Value:</span>
                <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-32">
                  {JSON.stringify(log.newValue, null, 2)}
                </pre>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <span className="font-medium text-foreground">Additional Info:</span>
                <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* User agent */}
            {log.userAgent && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">User Agent: </span>
                <span className="break-all">{log.userAgent}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

// =============================================================================
// MAIN AUDIT LOG VIEWER COMPONENT
// =============================================================================

export function AuditLogViewer({
  title = 'Activity Log',
  description = 'Track all admin actions and changes',
  initialFilter = {},
  showFilters = true,
  maxHeight = '600px',
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AuditLogQuery>(initialFilter);
  const [hasMore, setHasMore] = useState(false);

  const firestore = useFirestore();
  const { canViewAuditLogs, isLoading: isRoleLoading } = useAdminRole();
  const { toast } = useToast();

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    if (!firestore || !canViewAuditLogs) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const auditLogger = getAuditLogger(firestore);
      const result = await auditLogger.query({
        ...filter,
        limit: 50,
      });
      
      setLogs(result.items);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load activity log',
      });
    } finally {
      setIsLoading(false);
    }
  }, [firestore, canViewAuditLogs, filter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle filter change
  const handleActionFilter = (action: string) => {
    setFilter(prev => ({
      ...prev,
      action: action === 'all' ? undefined : action as AuditActionType,
    }));
  };

  const handleSuccessFilter = (success: string) => {
    setFilter(prev => ({
      ...prev,
      success: success === 'all' ? undefined : success === 'true',
    }));
  };

  // Permission check
  if (!isRoleLoading && !canViewAuditLogs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <p className="text-sm">You don't have permission to view the activity log.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-3 mt-4 flex-wrap">
            <Select onValueChange={handleActionFilter} defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <Separator className="my-1" />
                <SelectItem value={AuditAction.LOGIN}>Login</SelectItem>
                <SelectItem value={AuditAction.LOGOUT}>Logout</SelectItem>
                <SelectItem value={AuditAction.LOGIN_FAILED}>Login Failed</SelectItem>
                <Separator className="my-1" />
                <SelectItem value={AuditAction.CONTENT_CREATE}>Content Created</SelectItem>
                <SelectItem value={AuditAction.CONTENT_UPDATE}>Content Updated</SelectItem>
                <SelectItem value={AuditAction.CONTENT_DELETE}>Content Deleted</SelectItem>
                <SelectItem value={AuditAction.CONTENT_ROLLBACK}>Content Rollback</SelectItem>
                <Separator className="my-1" />
                <SelectItem value={AuditAction.ADMIN_CREATE}>Admin Added</SelectItem>
                <SelectItem value={AuditAction.ADMIN_DELETE}>Admin Removed</SelectItem>
                <SelectItem value={AuditAction.ADMIN_ROLE_CHANGE}>Role Changed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleSuccessFilter} defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Success</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-xl">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activity logs found</p>
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-3 pr-4">
              {logs.map(log => (
                <AuditLogItem key={log.id} log={log} />
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    More logs available. Refine your filters to see specific entries.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditLogViewer;
