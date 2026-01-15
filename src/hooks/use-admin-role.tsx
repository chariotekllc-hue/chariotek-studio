'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  UserRoleType,
  PermissionType,
  AdminUser,
  UserRole,
} from '@/lib/cms/types';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  canPerformContentAction,
  canManageAdmins,
  canViewAuditLogs,
  canViewVersionHistory,
  canRestoreVersions,
  isRoleAtLeast,
  getRoleDisplayName,
} from '@/lib/cms/rbac';

/**
 * Hook return type for admin role and permissions
 */
export interface UseAdminRoleResult {
  // User data
  user: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  
  // Role info
  role: UserRoleType | null;
  roleDisplayName: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isActive: boolean;
  
  // Permission checks
  hasPermission: (permission: PermissionType) => boolean;
  hasAllPermissions: (permissions: PermissionType[]) => boolean;
  hasAnyPermission: (permissions: PermissionType[]) => boolean;
  
  // Role checks
  isRoleAtLeast: (requiredRole: UserRoleType) => boolean;
  
  // Common permission shortcuts
  canEditContent: boolean;
  canPublishContent: boolean;
  canDeleteContent: boolean;
  canRollbackContent: boolean;
  canManageAdmins: boolean;
  canViewAuditLogs: boolean;
  canViewVersionHistory: boolean;
  canRestoreVersions: boolean;
}

/**
 * Enhanced hook to get current admin user's role and permissions.
 * 
 * This hook:
 * - Fetches admin user data from Firestore
 * - Provides role and permission checking utilities
 * - Handles loading and error states
 * - Memoizes results for performance
 * 
 * @returns {UseAdminRoleResult} Object with role info and permission utilities
 */
export function useAdminRole(): UseAdminRoleResult {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  // Memoize the admin user reference
  const adminUserRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'adminUsers', authUser.uid) : null),
    [firestore, authUser]
  );
  
  const { data: adminUserData, isLoading: isAdminLoading, error } = useDoc<AdminUser>(adminUserRef);
  
  // Memoize the result to prevent unnecessary recalculations
  const result = useMemo((): UseAdminRoleResult => {
    const isLoading = isUserLoading || isAdminLoading;
    const adminUser = adminUserData as AdminUser | null;
    const role = adminUser?.role ?? null;
    const isActive = adminUser?.isActive ?? false;
    
    // Create bound permission check functions
    const checkPermission = (permission: PermissionType): boolean => {
      if (!role || !isActive) return false;
      return hasPermission(role, permission);
    };
    
    const checkAllPermissions = (permissions: PermissionType[]): boolean => {
      if (!role || !isActive) return false;
      return hasAllPermissions(role, permissions);
    };
    
    const checkAnyPermission = (permissions: PermissionType[]): boolean => {
      if (!role || !isActive) return false;
      return hasAnyPermission(role, permissions);
    };
    
    const checkRoleAtLeast = (requiredRole: UserRoleType): boolean => {
      if (!role || !isActive) return false;
      return isRoleAtLeast(role, requiredRole);
    };
    
    return {
      // User data
      user: adminUser,
      isLoading,
      error: error || null,
      
      // Role info
      role,
      roleDisplayName: role ? getRoleDisplayName(role) : '',
      isAuthenticated: !!authUser,
      isAdmin: !!role && isActive,
      isSuperAdmin: role === UserRole.SUPER_ADMIN && isActive,
      isEditor: role === UserRole.EDITOR && isActive,
      isActive,
      
      // Permission checks
      hasPermission: checkPermission,
      hasAllPermissions: checkAllPermissions,
      hasAnyPermission: checkAnyPermission,
      
      // Role checks
      isRoleAtLeast: checkRoleAtLeast,
      
      // Common permission shortcuts
      canEditContent: role && isActive ? canPerformContentAction(role, 'update') : false,
      canPublishContent: role && isActive ? canPerformContentAction(role, 'publish') : false,
      canDeleteContent: role && isActive ? canPerformContentAction(role, 'delete') : false,
      canRollbackContent: role && isActive ? canPerformContentAction(role, 'rollback') : false,
      canManageAdmins: role && isActive ? canManageAdmins(role) : false,
      canViewAuditLogs: role && isActive ? canViewAuditLogs(role) : false,
      canViewVersionHistory: role && isActive ? canViewVersionHistory(role) : false,
      canRestoreVersions: role && isActive ? canRestoreVersions(role) : false,
    };
  }, [adminUserData, isUserLoading, isAdminLoading, error, authUser]);
  
  return result;
}

/**
 * Simple hook for backwards compatibility with existing useIsAdmin
 * @deprecated Use useAdminRole() instead for full RBAC support
 */
export function useIsAdminSimple() {
  const { isAdmin, isLoading, error } = useAdminRole();
  
  return useMemo(() => ({
    isAdmin,
    isLoading,
    error,
  }), [isAdmin, isLoading, error]);
}
