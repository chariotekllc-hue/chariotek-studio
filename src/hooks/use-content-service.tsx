'use client';

import { useCallback, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useAdminRole } from './use-admin-role';
import {
  ContentService,
  getContentService,
  SaveOptions,
  DeleteOptions,
  RollbackOptions,
} from '@/lib/cms/content-service';
import {
  OperationResult,
  ContentVersion,
} from '@/lib/cms/types';
import { VersionedDocument } from '@/lib/cms/version-manager';

/**
 * Hook return type for content service operations
 */
export interface UseContentServiceResult {
  // Service instance
  service: ContentService | null;
  isReady: boolean;
  
  // Content operations
  getContent: <T>(docPath: string) => Promise<VersionedDocument<T> | null>;
  saveContent: <T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    content: T,
    options?: Partial<Omit<SaveOptions, 'user'>>
  ) => Promise<OperationResult<{ version: number }>>;
  deleteContent: (
    docPath: string,
    contentType: string,
    options?: Partial<Omit<DeleteOptions, 'user'>>
  ) => Promise<OperationResult>;
  
  // Version operations
  getVersionHistory: (docPath: string, limit?: number) => Promise<ContentVersion[]>;
  getVersion: (docPath: string, version: number) => Promise<ContentVersion | null>;
  rollbackToVersion: (
    docPath: string,
    contentType: string,
    targetVersion: number
  ) => Promise<OperationResult<{ version: number; restoredVersion: number }>>;
  compareVersions: (
    docPath: string,
    versionA: number,
    versionB: number
  ) => Promise<{ versionA: ContentVersion | null; versionB: ContentVersion | null }>;
}

/**
 * Hook to use the content service with the current admin user context.
 * 
 * Automatically injects the current user into all operations that require it.
 * 
 * @returns {UseContentServiceResult} Content service operations bound to current user
 */
export function useContentService(): UseContentServiceResult {
  const firestore = useFirestore();
  const { user, isLoading, isAdmin } = useAdminRole();
  
  // Create service instance
  const service = useMemo(() => {
    if (!firestore) return null;
    return getContentService(firestore);
  }, [firestore]);
  
  const isReady = !isLoading && isAdmin && !!service && !!user;
  
  // Content operations
  const getContent = useCallback(async <T,>(docPath: string): Promise<VersionedDocument<T> | null> => {
    if (!service) throw new Error('Content service not initialized');
    return service.getContent<T>(docPath);
  }, [service]);
  
  const saveContent = useCallback(async <T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    content: T,
    options?: Partial<Omit<SaveOptions, 'user'>>
  ): Promise<OperationResult<{ version: number }>> => {
    if (!service || !user) {
      return {
        success: false,
        error: 'Content service not initialized or user not authenticated',
        errorCode: 'NOT_READY',
      };
    }
    
    return service.saveContent(docPath, contentType, content, {
      ...options,
      user,
    });
  }, [service, user]);
  
  const deleteContent = useCallback(async (
    docPath: string,
    contentType: string,
    options?: Partial<Omit<DeleteOptions, 'user'>>
  ): Promise<OperationResult> => {
    if (!service || !user) {
      return {
        success: false,
        error: 'Content service not initialized or user not authenticated',
        errorCode: 'NOT_READY',
      };
    }
    
    return service.deleteContent(docPath, contentType, {
      ...options,
      user,
    });
  }, [service, user]);
  
  // Version operations
  const getVersionHistory = useCallback(async (
    docPath: string,
    limit: number = 20
  ): Promise<ContentVersion[]> => {
    if (!service || !user) return [];
    return service.getVersionHistory(docPath, user, limit);
  }, [service, user]);
  
  const getVersion = useCallback(async (
    docPath: string,
    version: number
  ): Promise<ContentVersion | null> => {
    if (!service || !user) return null;
    return service.getVersion(docPath, version, user);
  }, [service, user]);
  
  const rollbackToVersion = useCallback(async (
    docPath: string,
    contentType: string,
    targetVersion: number
  ): Promise<OperationResult<{ version: number; restoredVersion: number }>> => {
    if (!service || !user) {
      return {
        success: false,
        error: 'Content service not initialized or user not authenticated',
        errorCode: 'NOT_READY',
      };
    }
    
    return service.rollbackContent(docPath, contentType, {
      user,
      targetVersion,
    });
  }, [service, user]);
  
  const compareVersions = useCallback(async (
    docPath: string,
    versionA: number,
    versionB: number
  ): Promise<{ versionA: ContentVersion | null; versionB: ContentVersion | null }> => {
    if (!service || !user) {
      return { versionA: null, versionB: null };
    }
    
    return service.compareVersions(docPath, versionA, versionB, user);
  }, [service, user]);
  
  return {
    service,
    isReady,
    getContent,
    saveContent,
    deleteContent,
    getVersionHistory,
    getVersion,
    rollbackToVersion,
    compareVersions,
  };
}
