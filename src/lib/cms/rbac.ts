/**
 * @file Role-Based Access Control (RBAC) Utilities
 * @description Functions for checking user permissions and roles.
 * 
 * This module provides:
 * - Permission checking functions
 * - Role validation
 * - Access control helpers
 */

import {
  UserRole,
  UserRoleType,
  Permission,
  PermissionType,
  RolePermissions,
  AdminUser,
} from './types';

// Re-export types for convenience
export { Permission, UserRole, ContentStatus } from './types';
export type { PermissionType, UserRoleType, ContentStatusType } from './types';

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRoleType, permission: PermissionType): boolean {
  const permissions = RolePermissions[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: UserRoleType, permissions: PermissionType[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRoleType, permissions: PermissionType[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRoleType): PermissionType[] {
  return RolePermissions[role] || [];
}

// =============================================================================
// ROLE HIERARCHY
// =============================================================================

/**
 * Role hierarchy levels (higher number = more privileges)
 */
const RoleHierarchy: Record<UserRoleType, number> = {
  [UserRole.EDITOR]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/**
 * Check if a role is at least as privileged as another
 */
export function isRoleAtLeast(role: UserRoleType, requiredRole: UserRoleType): boolean {
  return RoleHierarchy[role] >= RoleHierarchy[requiredRole];
}

/**
 * Check if a role can manage another role
 * (Super admins can manage all, admins cannot manage super_admins)
 */
export function canManageRole(managerRole: UserRoleType, targetRole: UserRoleType): boolean {
  if (managerRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  if (managerRole === UserRole.ADMIN) {
    return targetRole === UserRole.EDITOR;
  }
  return false;
}

// =============================================================================
// CONTENT ACCESS CONTROL
// =============================================================================

/**
 * Check if user can perform an action on content
 */
export function canPerformContentAction(
  role: UserRoleType,
  action: 'read' | 'create' | 'update' | 'delete' | 'publish' | 'rollback'
): boolean {
  const permissionMap: Record<string, PermissionType> = {
    read: Permission.CONTENT_READ,
    create: Permission.CONTENT_CREATE,
    update: Permission.CONTENT_UPDATE,
    delete: Permission.CONTENT_DELETE,
    publish: Permission.CONTENT_PUBLISH,
    rollback: Permission.CONTENT_ROLLBACK,
  };
  
  const permission = permissionMap[action];
  return permission ? hasPermission(role, permission) : false;
}

/**
 * Check if user can manage admin users
 */
export function canManageAdmins(role: UserRoleType): boolean {
  return hasPermission(role, Permission.ADMIN_CREATE) || 
         hasPermission(role, Permission.ADMIN_UPDATE) ||
         hasPermission(role, Permission.ADMIN_DELETE);
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(role: UserRoleType): boolean {
  return hasPermission(role, Permission.AUDIT_READ);
}

/**
 * Check if user can view version history
 */
export function canViewVersionHistory(role: UserRoleType): boolean {
  return hasPermission(role, Permission.VERSION_READ);
}

/**
 * Check if user can restore versions
 */
export function canRestoreVersions(role: UserRoleType): boolean {
  return hasPermission(role, Permission.VERSION_RESTORE);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate if a string is a valid role
 */
export function isValidRole(role: string): role is UserRoleType {
  return Object.values(UserRole).includes(role as UserRoleType);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRoleType): string {
  const displayNames: Record<UserRoleType, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.EDITOR]: 'Editor',
  };
  return displayNames[role] || role;
}

/**
 * Get role badge color class for UI
 */
export function getRoleBadgeClass(role: UserRoleType): string {
  const colors: Record<UserRoleType, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    [UserRole.ADMIN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    [UserRole.EDITOR]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

// =============================================================================
// ACCESS CONTROL DECISION
// =============================================================================

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  requiredPermission?: PermissionType;
  requiredRole?: UserRoleType;
}

/**
 * Make an access control decision with detailed reasoning
 */
export function makeAccessDecision(
  user: AdminUser | null | undefined,
  requiredPermission: PermissionType
): AccessDecision {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }
  
  if (!user.isActive) {
    return {
      allowed: false,
      reason: 'User account is deactivated',
    };
  }
  
  if (!isValidRole(user.role)) {
    return {
      allowed: false,
      reason: 'Invalid user role',
    };
  }
  
  if (!hasPermission(user.role, requiredPermission)) {
    return {
      allowed: false,
      reason: `Missing required permission: ${requiredPermission}`,
      requiredPermission,
    };
  }
  
  return {
    allowed: true,
  };
}

/**
 * Create a permission guard function for use in components
 */
export function createPermissionGuard(requiredPermissions: PermissionType[]) {
  return (role: UserRoleType | undefined): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, requiredPermissions);
  };
}
