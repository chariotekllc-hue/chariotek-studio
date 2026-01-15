'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Home,
  Info,
  Briefcase,
  Wrench,
  GraduationCap,
  HardHat,
  Scale,
  Users,
  AlertCircle,
  Shield,
  Activity,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth, useUser, initiateEmailSignIn, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAdminRole } from '@/hooks/use-admin-role';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleBadgeClass, getRoleDisplayName } from '@/lib/cms/rbac';
import { getAuditLogger } from '@/lib/cms/audit-logger';
import { UserRole } from '@/lib/cms/types';

// =============================================================================
// LAZY LOADED COMPONENTS
// =============================================================================

const SiteConfigForm = dynamic(
  () => import('@/components/admin/SiteConfigForm').then(mod => ({ default: mod.SiteConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const HomeConfigForm = dynamic(
  () => import('@/components/admin/HomeConfigForm').then(mod => ({ default: mod.HomeConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const AboutConfigForm = dynamic(
  () => import('@/components/admin/AboutConfigForm').then(mod => ({ default: mod.AboutConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const ServicesConfigForm = dynamic(
  () => import('@/components/admin/ServicesConfigForm').then(mod => ({ default: mod.ServicesConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const TrainingConfigForm = dynamic(
  () => import('@/components/admin/TrainingConfigForm').then(mod => ({ default: mod.TrainingConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const PortfolioConfigForm = dynamic(
  () => import('@/components/admin/PortfolioConfigForm').then(mod => ({ default: mod.PortfolioConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const ToolsConfigForm = dynamic(
  () => import('@/components/admin/ToolsConfigForm').then(mod => ({ default: mod.ToolsConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const LegalConfigForm = dynamic(
  () => import('@/components/admin/LegalConfigForm').then(mod => ({ default: mod.LegalConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const AdminUsersConfigForm = dynamic(
  () => import('@/components/admin/AdminUsersConfigForm').then(mod => ({ default: mod.AdminUsersConfigForm })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const DashboardSummary = dynamic(
  () => import('@/components/admin/DashboardSummary').then(mod => ({ default: mod.DashboardSummary })),
  { loading: () => <FormSkeleton />, ssr: false }
);

const AuditLogViewer = dynamic(
  () => import('@/components/admin/AuditLogViewer').then(mod => ({ default: mod.AuditLogViewer })),
  { loading: () => <FormSkeleton />, ssr: false }
);

// =============================================================================
// TYPES
// =============================================================================

type AdminSection = 
  | 'dashboard' 
  | 'site-config' 
  | 'home' 
  | 'about' 
  | 'services' 
  | 'training' 
  | 'portfolio' 
  | 'tools' 
  | 'legal' 
  | 'admins'
  | 'activity';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPermission?: 'canEditContent' | 'canManageAdmins' | 'canViewAuditLogs';
}

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'site-config', label: 'Site Config', icon: Settings, requiresPermission: 'canEditContent' },
  { id: 'home', label: 'Home Page', icon: Home, requiresPermission: 'canEditContent' },
  { id: 'about', label: 'About Page', icon: Info, requiresPermission: 'canEditContent' },
  { id: 'services', label: 'Services', icon: Briefcase, requiresPermission: 'canEditContent' },
  { id: 'training', label: 'Training', icon: GraduationCap, requiresPermission: 'canEditContent' },
  { id: 'portfolio', label: 'Portfolio', icon: Wrench, requiresPermission: 'canEditContent' },
  { id: 'tools', label: 'Tools', icon: HardHat, requiresPermission: 'canEditContent' },
  { id: 'legal', label: 'Legal', icon: Scale, requiresPermission: 'canEditContent' },
  { id: 'admins', label: 'Admin Users', icon: Users, requiresPermission: 'canManageAdmins' },
  { id: 'activity', label: 'Activity Log', icon: Activity, requiresPermission: 'canViewAuditLogs' },
];

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}

function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 md:w-72 border-r border-border p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Separator />
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </aside>
      <main className="flex-1 p-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    </div>
  );
}

// =============================================================================
// ADMIN DASHBOARD
// =============================================================================

function AdminDashboard() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  
  const {
    user,
    role,
    roleDisplayName,
    canEditContent,
    canManageAdmins,
    canViewAuditLogs,
    isSuperAdmin,
  } = useAdminRole();

  // Log logout
  const handleLogout = async () => {
    if (!auth || !firestore || !user || !role) return;
    
    try {
      // Log the logout action
      const auditLogger = getAuditLogger(firestore);
      await auditLogger.logLogout(user.id, user.email, role);
    } catch (error) {
      console.error('Failed to log logout:', error);
    }
    
    await signOut(auth);
  };

  // Check if nav item should be visible based on permissions
  const isNavItemVisible = (item: NavItem): boolean => {
    if (!item.requiresPermission) return true;
    
    switch (item.requiresPermission) {
      case 'canEditContent':
        return canEditContent;
      case 'canManageAdmins':
        return canManageAdmins;
      case 'canViewAuditLogs':
        return canViewAuditLogs;
      default:
        return true;
    }
  };

  // Render active section content
  const renderSection = () => {
    switch (activeSection) {
      case 'site-config':
        return canEditContent ? <SiteConfigForm /> : <PermissionDenied />;
      case 'home':
        return canEditContent ? <HomeConfigForm /> : <PermissionDenied />;
      case 'about':
        return canEditContent ? <AboutConfigForm /> : <PermissionDenied />;
      case 'services':
        return canEditContent ? <ServicesConfigForm /> : <PermissionDenied />;
      case 'training':
        return canEditContent ? <TrainingConfigForm /> : <PermissionDenied />;
      case 'portfolio':
        return canEditContent ? <PortfolioConfigForm /> : <PermissionDenied />;
      case 'tools':
        return canEditContent ? <ToolsConfigForm /> : <PermissionDenied />;
      case 'legal':
        return canEditContent ? <LegalConfigForm /> : <PermissionDenied />;
      case 'admins':
        return canManageAdmins ? <AdminUsersConfigForm /> : <PermissionDenied />;
      case 'activity':
        return canViewAuditLogs ? (
          <AuditLogViewer
            title="Full Activity Log"
            description="Complete audit trail of all admin actions"
            maxHeight="calc(100vh - 300px)"
          />
        ) : <PermissionDenied />;
      case 'dashboard':
      default:
        return <DashboardSummary />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="
        w-64 md:w-72
        border-r border-border
        bg-card/50
        backdrop-blur-sm
        flex flex-col
        sticky top-0
        h-screen
        overflow-hidden
      ">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-foreground tracking-tight">
                Admin Panel
              </h2>
              <p className="text-xs text-muted-foreground">
                Content Management
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
              <Badge className={`text-xs mt-1 ${getRoleBadgeClass(role!)}`}>
                {roleDisplayName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.filter(isNavItemVisible).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`
                  w-full justify-start h-10 font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-accent/10 text-accent border-l-2 border-accent rounded-l-none' 
                    : 'hover:bg-muted hover:text-foreground'
                  }
                `}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {/* View Site Link */}
          <Button
            variant="outline"
            className="w-full justify-start h-10 font-medium"
            asChild
          >
            <Link href="/" target="_blank">
              <ExternalLink className="mr-3 h-4 w-4" />
              View Site
            </Link>
          </Button>

          {/* Logout Button */}
          <Button
            variant="outline"
            className="
              w-full justify-start h-10 font-medium
              hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20
            "
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// PERMISSION DENIED COMPONENT
// =============================================================================

function PermissionDenied() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <Shield className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle>Permission Required</CardTitle>
        <CardDescription>
          You don't have the required permissions to access this section.
          Contact a super admin if you need access.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

// =============================================================================
// LOGIN PAGE
// =============================================================================

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const userCredential = await initiateEmailSignIn(auth, email, password);
      
      // Log successful login (will be done after role is fetched in dashboard)
      setEmail('');
      setPassword('');
    } catch (error: any) {
      // Log failed login attempt
      if (firestore) {
        try {
          const auditLogger = getAuditLogger(firestore);
          await auditLogger.logLogin(
            'unknown',
            email,
            'unknown' as any,
            false,
            error.message
          );
        } catch (logError) {
          console.error('Failed to log login attempt:', logError);
        }
      }

      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="
        relative z-10
        w-full max-w-md
        bg-card/95 backdrop-blur-sm
        border border-border
        rounded-3xl
        shadow-2xl
      ">
        <CardHeader className="text-center pb-6">
          <div className="
            mx-auto flex h-16 w-16 items-center justify-center
            rounded-2xl bg-accent/10 mb-6
          ">
            <KeyRound className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
            Admin Access
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sign in to manage website content
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {loginError && (
              <div className="
                p-4 rounded-xl
                bg-destructive/10 border border-destructive/20
                flex items-start gap-3
              ">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{loginError}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@chariotek.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError(null);
                }}
                disabled={isLoggingIn}
                className="
                  h-12 rounded-xl
                  border-border bg-background
                  transition-all duration-200
                  focus:ring-2 focus:ring-accent/20 focus:border-accent
                "
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(null);
                }}
                disabled={isLoggingIn}
                className="
                  h-12 rounded-xl
                  border-border bg-background
                  transition-all duration-200
                  focus:ring-2 focus:ring-accent/20 focus:border-accent
                "
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="
                w-full h-12 rounded-xl
                font-semibold text-base
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
              "
              size="lg"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            This is a protected area. Unauthorized access attempts are logged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// ACCESS DENIED PAGE
// =============================================================================

function AdminAccessDenied() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="
            mx-auto flex h-16 w-16 items-center justify-center
            rounded-2xl bg-destructive/10 mb-6
          ">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Access Denied
          </CardTitle>
          <CardDescription className="mt-2">
            You don't have administrator privileges to access this panel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {user && (
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Only users listed in the adminUsers collection can access the admin panel.
              If you believe this is an error, please contact a system administrator.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button variant="ghost" asChild className="w-full h-11">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN ADMIN PAGE
// =============================================================================

/**
 * Secure Admin Page with RBAC
 * 
 * Authentication flow:
 * 1. Check if user is authenticated
 * 2. Verify user exists in adminUsers collection
 * 3. Check if user is active
 * 4. Load dashboard with role-appropriate UI
 */
export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isRoleLoading, user: adminUser, role } = useAdminRole();
  const firestore = useFirestore();

  // Log successful login when admin user data is loaded
  useEffect(() => {
    if (adminUser && role && firestore && !isRoleLoading) {
      const logLogin = async () => {
        try {
          const auditLogger = getAuditLogger(firestore);
          await auditLogger.logLogin(adminUser.id, adminUser.email, role, true);
        } catch (error) {
          console.error('Failed to log login:', error);
        }
      };
      
      // Only log once per session
      const sessionKey = `admin_login_${adminUser.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        logLogin();
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [adminUser, role, firestore, isRoleLoading]);

  // Show loading screen while checking authentication
  if (isUserLoading || isRoleLoading) {
    return <AdminLoadingScreen />;
  }

  // If not authenticated, show login page
  if (!user) {
    return <AdminLoginPage />;
  }

  // If authenticated but not an admin, show access denied
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  // User is authenticated and is an admin - show dashboard
  return <AdminDashboard />;
}
