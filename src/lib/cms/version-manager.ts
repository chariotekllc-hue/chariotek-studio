/**
 * @file Version Manager Service
 * @description Handles content versioning, snapshots, and rollback functionality.
 * 
 * Key features:
 * - Automatic version creation on content updates
 * - Version history storage
 * - One-click rollback to any previous version
 * - Optimistic locking to prevent overwrites
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Firestore,
  runTransaction,
  increment,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { ContentStatus, ContentStatusType } from './types';
import {
  ContentVersion,
  ContentMetadata,
  ContentStatus,
  OperationResult,
  PaginatedResult,
} from './types';
import { AuditLogger, getAuditLogger } from './audit-logger';

// =============================================================================
// CONSTANTS
// =============================================================================

const VERSIONS_SUBCOLLECTION = '_versions';
const MAX_VERSIONS_TO_KEEP = 50; // Maximum versions to retain per document

// =============================================================================
// TYPES
// =============================================================================

export interface VersionedDocument<T = Record<string, unknown>> {
  content: T;
  _meta: {
    version: number;
    status: ContentStatusType;
    createdAt: number;
    createdBy: string;
    updatedAt: number;
    updatedBy: string;
    publishedAt?: number;
    publishedBy?: string;
  };
}

export interface SaveContentOptions {
  userId: string;
  userEmail: string;
  changeDescription?: string;
  expectedVersion?: number; // For optimistic locking
  publish?: boolean;
}

export interface RollbackOptions {
  userId: string;
  userEmail: string;
  targetVersion: number;
}

// =============================================================================
// VERSION MANAGER CLASS
// =============================================================================

export class VersionManager {
  private firestore: Firestore;
  private auditLogger: AuditLogger;
  
  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.auditLogger = getAuditLogger(firestore);
  }
  
  // ===========================================================================
  // VERSION OPERATIONS
  // ===========================================================================
  
  /**
   * Get the versions subcollection reference for a document
   */
  private getVersionsCollection(docPath: string): CollectionReference {
    return collection(this.firestore, docPath, VERSIONS_SUBCOLLECTION);
  }
  
  /**
   * Create a version snapshot
   */
  private async createVersionSnapshot(
    docPath: string,
    content: Record<string, unknown>,
    version: number,
    userId: string,
    userEmail: string,
    changeDescription?: string,
    isRollback: boolean = false,
    rolledBackFrom?: number
  ): Promise<string> {
    const versionsCol = this.getVersionsCollection(docPath);
    
    const versionDoc: Omit<ContentVersion, 'versionId'> = {
      versionId: uuidv4(),
      version,
      contentSnapshot: content,
      createdAt: Date.now(),
      createdBy: userId,
      createdByEmail: userEmail,
      changeDescription,
      isRollback,
      rolledBackFrom,
    };
    
    const docRef = await addDoc(versionsCol, versionDoc);
    return docRef.id;
  }
  
  /**
   * Get version history for a document
   */
  async getVersionHistory(
    docPath: string,
    limitCount: number = 20
  ): Promise<ContentVersion[]> {
    const versionsCol = this.getVersionsCollection(docPath);
    const q = query(
      versionsCol,
      orderBy('version', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      versionId: doc.id,
    } as ContentVersion));
  }
  
  /**
   * Get a specific version
   */
  async getVersion(docPath: string, version: number): Promise<ContentVersion | null> {
    const versionsCol = this.getVersionsCollection(docPath);
    const q = query(versionsCol, where('version', '==', version), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return {
      ...snapshot.docs[0].data(),
      versionId: snapshot.docs[0].id,
    } as ContentVersion;
  }
  
  // ===========================================================================
  // CONTENT OPERATIONS
  // ===========================================================================
  
  /**
   * Save content with automatic versioning
   * 
   * This method:
   * 1. Creates a version snapshot of the current content (if exists)
   * 2. Updates the document with new content
   * 3. Increments the version number
   * 4. Supports optimistic locking via expectedVersion
   */
  async saveContent<T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    content: T,
    options: SaveContentOptions
  ): Promise<OperationResult<{ version: number }>> {
    const docRef = doc(this.firestore, docPath);
    
    try {
      const result = await runTransaction(this.firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const exists = docSnap.exists();
        const currentData = docSnap.data() as VersionedDocument<T> | undefined;
        const currentVersion = currentData?._meta?.version ?? 0;
        
        // Optimistic locking check
        if (options.expectedVersion !== undefined && currentVersion !== options.expectedVersion) {
          throw new Error(
            `Version conflict: expected version ${options.expectedVersion}, but current version is ${currentVersion}. ` +
            'Please refresh and try again.'
          );
        }
        
        const newVersion = currentVersion + 1;
        const now = Date.now();
        
        // Prepare the new document
        const newDoc: VersionedDocument<T> = {
          content,
          _meta: {
            version: newVersion,
            status: options.publish ? ContentStatus.PUBLISHED : (currentData?._meta?.status || ContentStatus.DRAFT),
            createdAt: currentData?._meta?.createdAt || now,
            createdBy: currentData?._meta?.createdBy || options.userId,
            updatedAt: now,
            updatedBy: options.userId,
            publishedAt: options.publish ? now : currentData?._meta?.publishedAt,
            publishedBy: options.publish ? options.userId : currentData?._meta?.publishedBy,
          },
        };
        
        // Save the document
        transaction.set(docRef, newDoc, { merge: false });
        
        return {
          newVersion,
          previousContent: exists ? currentData?.content : null,
          previousVersion: currentVersion,
        };
      });
      
      // Create version snapshot (outside transaction for performance)
      if (result.previousContent) {
        await this.createVersionSnapshot(
          docPath,
          result.previousContent as Record<string, unknown>,
          result.previousVersion,
          options.userId,
          options.userEmail,
          options.changeDescription
        );
      }
      
      // Cleanup old versions if needed
      this.cleanupOldVersions(docPath).catch(console.error);
      
      return {
        success: true,
        data: { version: result.newVersion },
      };
    } catch (error: any) {
      console.error('[VersionManager] Save content error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to save content',
        errorCode: error.code,
      };
    }
  }
  
  /**
   * Rollback content to a previous version
   */
  async rollbackToVersion<T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    options: RollbackOptions,
    userRole: string
  ): Promise<OperationResult<{ version: number; restoredVersion: number }>> {
    const docRef = doc(this.firestore, docPath);
    
    try {
      // Get the target version
      const targetVersionDoc = await this.getVersion(docPath, options.targetVersion);
      if (!targetVersionDoc) {
        return {
          success: false,
          error: `Version ${options.targetVersion} not found`,
          errorCode: 'VERSION_NOT_FOUND',
        };
      }
      
      const result = await runTransaction(this.firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Document does not exist');
        }
        
        const currentData = docSnap.data() as VersionedDocument<T>;
        const currentVersion = currentData._meta.version;
        const newVersion = currentVersion + 1;
        const now = Date.now();
        
        // Restore the content from the target version
        const restoredContent = targetVersionDoc.contentSnapshot as T;
        
        const newDoc: VersionedDocument<T> = {
          content: restoredContent,
          _meta: {
            ...currentData._meta,
            version: newVersion,
            updatedAt: now,
            updatedBy: options.userId,
          },
        };
        
        transaction.set(docRef, newDoc, { merge: false });
        
        return {
          newVersion,
          previousContent: currentData.content,
          previousVersion: currentVersion,
        };
      });
      
      // Create version snapshot of the current state before rollback
      await this.createVersionSnapshot(
        docPath,
        result.previousContent as Record<string, unknown>,
        result.previousVersion,
        options.userId,
        options.userEmail,
        `Rollback to version ${options.targetVersion}`,
        true,
        options.targetVersion
      );
      
      // Log the rollback
      await this.auditLogger.logContentRollback(
        options.userId,
        options.userEmail,
        userRole as any,
        contentType,
        docPath,
        docPath,
        result.previousContent as Record<string, unknown>,
        targetVersionDoc.contentSnapshot as Record<string, unknown>,
        result.previousVersion,
        options.targetVersion,
        true
      );
      
      return {
        success: true,
        data: {
          version: result.newVersion,
          restoredVersion: options.targetVersion,
        },
      };
    } catch (error: any) {
      console.error('[VersionManager] Rollback error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to rollback content',
        errorCode: error.code,
      };
    }
  }
  
  /**
   * Get current document with metadata
   */
  async getCurrentContent<T>(docPath: string): Promise<VersionedDocument<T> | null> {
    const docRef = doc(this.firestore, docPath);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return docSnap.data() as VersionedDocument<T>;
  }
  
  /**
   * Compare two versions
   */
  async compareVersions(
    docPath: string,
    versionA: number,
    versionB: number
  ): Promise<{
    versionA: ContentVersion | null;
    versionB: ContentVersion | null;
  }> {
    const [vA, vB] = await Promise.all([
      this.getVersion(docPath, versionA),
      this.getVersion(docPath, versionB),
    ]);
    
    return { versionA: vA, versionB: vB };
  }
  
  // ===========================================================================
  // CLEANUP
  // ===========================================================================
  
  /**
   * Remove old versions beyond the retention limit
   */
  private async cleanupOldVersions(docPath: string): Promise<void> {
    const versionsCol = this.getVersionsCollection(docPath);
    const q = query(
      versionsCol,
      orderBy('version', 'desc'),
      limit(MAX_VERSIONS_TO_KEEP + 10)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.size <= MAX_VERSIONS_TO_KEEP) {
      return;
    }
    
    // Delete excess versions (soft delete by marking as archived would be better in production)
    const toDelete = snapshot.docs.slice(MAX_VERSIONS_TO_KEEP);
    for (const docToDelete of toDelete) {
      // In production, consider soft delete instead
      // await deleteDoc(docToDelete.ref);
      console.log(`[VersionManager] Would delete old version: ${docToDelete.id}`);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let versionManagerInstance: VersionManager | null = null;

/**
 * Get or create the version manager instance
 */
export function getVersionManager(firestore: Firestore): VersionManager {
  if (!versionManagerInstance) {
    versionManagerInstance = new VersionManager(firestore);
  }
  return versionManagerInstance;
}
