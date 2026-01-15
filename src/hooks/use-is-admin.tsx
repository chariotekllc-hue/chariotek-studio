'use client';

import { useMemo } from 'react';
import { useAdminRole } from './use-admin-role';

/**
 * Simple hook to check if current user is an admin.
 * 
 * This is a backwards-compatible wrapper around useAdminRole.
 * For full RBAC support, use useAdminRole() directly.
 * 
 * @returns Object with isAdmin, isLoading, and error
 * 
 * @example
 * ```tsx
 * const { isAdmin, isLoading } = useIsAdmin();
 * 
 * if (isLoading) return <Loading />;
 * if (!isAdmin) return <AccessDenied />;
 * return <AdminContent />;
 * ```
 */
export function useIsAdmin() {
  const { isAdmin, isLoading, error } = useAdminRole();
  
  return useMemo(() => ({
    isAdmin,
    isLoading,
    error,
  }), [isAdmin, isLoading, error]);
}
