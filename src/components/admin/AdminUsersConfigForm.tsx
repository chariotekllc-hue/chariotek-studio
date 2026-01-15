'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, doc } from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2, Shield, AlertTriangle, Users } from 'lucide-react';
import { useAdminRole } from '@/hooks/use-admin-role';
import {
  AdminUser,
  UserRole,
  UserRoleType,
} from '@/lib/cms/types';
import {
  getRoleDisplayName,
  getRoleBadgeClass,
  canManageRole,
} from '@/lib/cms/rbac';
import { getAuditLogger } from '@/lib/cms/audit-logger';

// =============================================================================
// SCHEMAS
// =============================================================================

const newAdminSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  displayName: z.string().optional(),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR]),
});

type NewAdminFormData = z.infer<typeof newAdminSchema>;

// =============================================================================
// LOADING SKELETON
// =============================================================================

function AdminUsersSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// ADMIN USER ITEM
// =============================================================================

interface AdminUserItemProps {
  admin: AdminUser;
  currentUser: AdminUser | null;
  canManage: boolean;
  onRoleChange: (admin: AdminUser, newRole: UserRoleType) => void;
  onToggleActive: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
}

function AdminUserItem({
  admin,
  currentUser,
  canManage,
  onRoleChange,
  onToggleActive,
  onDelete,
}: AdminUserItemProps) {
  const isCurrentUser = currentUser?.id === admin.id;
  const canEdit = canManage && !isCurrentUser;
  const canChangeRole = canEdit && (currentUser?.role === UserRole.SUPER_ADMIN);

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                {admin.email}
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
                {!admin.isActive && (
                  <Badge variant="destructive" className="text-xs">Inactive</Badge>
                )}
              </p>
              {admin.displayName && (
                <p className="text-sm text-muted-foreground">{admin.displayName}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ID: {admin.id}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Role selector */}
            {canChangeRole ? (
              <Select
                value={admin.role}
                onValueChange={(value) => onRoleChange(admin, value as UserRoleType)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getRoleBadgeClass(admin.role)}>
                {getRoleDisplayName(admin.role)}
              </Badge>
            )}

            {/* Active toggle */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={admin.isActive}
                  onCheckedChange={() => onToggleActive(admin)}
                  aria-label="Toggle active status"
                />
              </div>
            )}

            {/* Delete button */}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(admin)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AdminUsersConfigForm() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: currentAdminUser, canManageAdmins, isSuperAdmin, role: currentRole } = useAdminRole();
  
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch admin users
  const adminUsersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'adminUsers') : null),
    [firestore]
  );
  const { data: adminUsersData, isLoading, forceRefetch } = useCollection<AdminUser>(adminUsersRef);

  // Form for adding new admin
  const form = useForm<NewAdminFormData>({
    resolver: zodResolver(newAdminSchema),
    defaultValues: {
      userId: '',
      email: '',
      displayName: '',
      role: UserRole.EDITOR,
    },
  });

  // Handle add admin
  const handleAddAdmin = async (data: NewAdminFormData) => {
    if (!firestore || !adminUsersRef || !currentAdminUser) return;

    // Check if trying to add super_admin without being super_admin
    if (data.role === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only super admins can create other super admins.',
      });
      return;
    }

    const newAdmin: AdminUser = {
      id: data.userId,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: Date.now(),
      createdBy: currentAdminUser.id,
      isActive: true,
    };

    const adminRef = doc(adminUsersRef, data.userId);
    
    try {
      await setDocumentNonBlocking(adminRef, newAdmin, {});

      // Log the action
      const auditLogger = getAuditLogger(firestore);
      await auditLogger.logAdminManagement(
        'create',
        { userId: currentAdminUser.id, userEmail: currentAdminUser.email, userRole: currentRole! },
        { userId: data.userId, userEmail: data.email },
        undefined,
        newAdmin as unknown as Record<string, unknown>,
        true
      );

      toast({
        title: 'Admin Added',
        description: `${data.email} has been granted ${getRoleDisplayName(data.role)} access.`,
      });

      form.reset();
      forceRefetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add admin user.',
      });
    }
  };

  // Handle role change
  const handleRoleChange = async (admin: AdminUser, newRole: UserRoleType) => {
    if (!firestore || !adminUsersRef || !currentAdminUser) return;

    // Only super_admin can change roles
    if (!isSuperAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only super admins can change user roles.',
      });
      return;
    }

    const previousRole = admin.role;
    const adminRef = doc(adminUsersRef, admin.id);

    try {
      await setDocumentNonBlocking(adminRef, {
        role: newRole,
        updatedAt: Date.now(),
        updatedBy: currentAdminUser.id,
      }, { merge: true });

      // Log the action
      const auditLogger = getAuditLogger(firestore);
      await auditLogger.logAdminManagement(
        'role_change',
        { userId: currentAdminUser.id, userEmail: currentAdminUser.email, userRole: currentRole! },
        { userId: admin.id, userEmail: admin.email },
        { role: previousRole } as Record<string, unknown>,
        { role: newRole } as Record<string, unknown>,
        true
      );

      toast({
        title: 'Role Updated',
        description: `${admin.email}'s role changed to ${getRoleDisplayName(newRole)}.`,
      });

      forceRefetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update role.',
      });
    }
  };

  // Handle toggle active
  const handleToggleActive = async (admin: AdminUser) => {
    if (!firestore || !adminUsersRef || !currentAdminUser) return;

    const adminRef = doc(adminUsersRef, admin.id);
    const newStatus = !admin.isActive;

    try {
      await setDocumentNonBlocking(adminRef, {
        isActive: newStatus,
        updatedAt: Date.now(),
        updatedBy: currentAdminUser.id,
      }, { merge: true });

      // Log the action
      const auditLogger = getAuditLogger(firestore);
      await auditLogger.logAdminManagement(
        'update',
        { userId: currentAdminUser.id, userEmail: currentAdminUser.email, userRole: currentRole! },
        { userId: admin.id, userEmail: admin.email },
        { isActive: admin.isActive } as Record<string, unknown>,
        { isActive: newStatus } as Record<string, unknown>,
        true
      );

      toast({
        title: newStatus ? 'Admin Activated' : 'Admin Deactivated',
        description: `${admin.email} has been ${newStatus ? 'activated' : 'deactivated'}.`,
      });

      forceRefetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update admin status.',
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget || !firestore || !adminUsersRef || !currentAdminUser) return;

    setIsDeleting(true);

    // Note: Client-side delete is blocked by Firestore rules
    // This would need to be done via Admin SDK or Cloud Function
    // For now, we'll just deactivate the user instead
    
    try {
      const adminRef = doc(adminUsersRef, deleteTarget.id);
      
      // Soft delete - deactivate instead of hard delete
      await setDocumentNonBlocking(adminRef, {
        isActive: false,
        updatedAt: Date.now(),
        updatedBy: currentAdminUser.id,
      }, { merge: true });

      // Log the action
      const auditLogger = getAuditLogger(firestore);
      await auditLogger.logAdminManagement(
        'delete',
        { userId: currentAdminUser.id, userEmail: currentAdminUser.email, userRole: currentRole! },
        { userId: deleteTarget.id, userEmail: deleteTarget.email },
        deleteTarget as unknown as Record<string, unknown>,
        undefined,
        true
      );

      toast({
        title: 'Admin Removed',
        description: `${deleteTarget.email}'s access has been revoked.`,
      });

      forceRefetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove admin.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Check permissions
  if (!canManageAdmins) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <p>You don't have permission to manage admin users.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <AdminUsersSkeleton />;
  }

  const adminUsers = adminUsersData || [];

  return (
    <div className="space-y-8">
      {/* Existing Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users
          </CardTitle>
          <CardDescription>
            Manage administrator access and roles. {adminUsers.length} user{adminUsers.length !== 1 ? 's' : ''} total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin users found.</p>
          ) : (
            adminUsers.map((admin) => (
              <AdminUserItem
                key={admin.id}
                admin={admin}
                currentUser={currentAdminUser}
                canManage={canManageAdmins}
                onRoleChange={handleRoleChange}
                onToggleActive={handleToggleActive}
                onDelete={(a) => setDeleteTarget(a)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Add New Admin */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddAdmin)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Admin
              </CardTitle>
              <CardDescription>
                Grant administrative access to a new user. The User ID must match their Firebase Authentication UID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="admin@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID (UID)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Firebase Authentication UID" />
                      </FormControl>
                      <FormDescription>
                        Found in Firebase Console → Authentication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSuperAdmin && (
                            <SelectItem value={UserRole.SUPER_ADMIN}>
                              Super Admin - Full access
                            </SelectItem>
                          )}
                          <SelectItem value={UserRole.ADMIN}>
                            Admin - Edit & publish content
                          </SelectItem>
                          <SelectItem value={UserRole.EDITOR}>
                            Editor - Edit content only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Adding...' : 'Add Admin User'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Admin Access?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin access for <strong>{deleteTarget?.email}</strong>.
              They will no longer be able to access the admin panel.
              <br /><br />
              <span className="text-muted-foreground">
                Note: This action deactivates the user. Full deletion requires server-side access.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing...' : 'Remove Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
