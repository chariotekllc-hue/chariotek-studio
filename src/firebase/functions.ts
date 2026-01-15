/**
 * Cloud Functions Client Utilities
 * 
 * Provides typed wrappers for calling Cloud Functions from the client.
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { app } from './index';

// Get functions instance
const functions = getFunctions(app);

// =============================================================================
// TYPES
// =============================================================================

interface DeleteAdminUserParams {
  targetUserId: string;
  deleteAuthUser?: boolean;
}

interface DeleteAdminUserResult {
  success: boolean;
  message: string;
}

interface CreateBackupResult {
  success: boolean;
  backupId: string;
  collections: string[];
}

interface AdminStats {
  totalActions: number;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  successRate: number;
  failedActions: number;
}

interface GetAdminStatsParams {
  startDate?: number;
  endDate?: number;
}

// =============================================================================
// FUNCTION WRAPPERS
// =============================================================================

/**
 * Delete an admin user (super_admin only)
 * 
 * @param params - Target user ID and whether to delete auth user
 * @returns Promise with success status and message
 */
export async function deleteAdminUser(
  params: DeleteAdminUserParams
): Promise<DeleteAdminUserResult> {
  const callable = httpsCallable<DeleteAdminUserParams, DeleteAdminUserResult>(
    functions,
    'deleteAdminUser'
  );
  
  const result: HttpsCallableResult<DeleteAdminUserResult> = await callable(params);
  return result.data;
}

/**
 * Create a database backup (super_admin only)
 * 
 * @returns Promise with backup ID and collections backed up
 */
export async function createBackup(): Promise<CreateBackupResult> {
  const callable = httpsCallable<void, CreateBackupResult>(
    functions,
    'createBackup'
  );
  
  const result: HttpsCallableResult<CreateBackupResult> = await callable();
  return result.data;
}

/**
 * Get admin activity statistics (super_admin only)
 * 
 * @param params - Optional date range
 * @returns Promise with admin statistics
 */
export async function getAdminStats(
  params?: GetAdminStatsParams
): Promise<AdminStats> {
  const callable = httpsCallable<GetAdminStatsParams | undefined, AdminStats>(
    functions,
    'getAdminStats'
  );
  
  const result: HttpsCallableResult<AdminStats> = await callable(params);
  return result.data;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Check if an error is a Firebase Functions error
 */
export function isFunctionsError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Get user-friendly error message from Functions error
 */
export function getFunctionsErrorMessage(error: unknown): string {
  if (isFunctionsError(error)) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return 'You must be logged in to perform this action.';
      case 'functions/permission-denied':
        return 'You do not have permission to perform this action.';
      case 'functions/not-found':
        return 'The requested resource was not found.';
      case 'functions/invalid-argument':
        return 'Invalid input provided.';
      case 'functions/failed-precondition':
        return error.message || 'This action cannot be performed.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred.';
}
