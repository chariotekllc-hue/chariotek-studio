/**
 * @file Content Service
 * @description High-level service for content management with versioning, 
 * sanitization, validation, and audit logging.
 * 
 * This service provides a unified API for all content operations:
 * - Save with automatic versioning
 * - Rollback to previous versions
 * - View version history
 * - Audit logging
 */

import { Firestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { z } from 'zod';
import {
  VersionManager,
  getVersionManager,
  VersionedDocument,
  SaveContentOptions,
} from './version-manager';
import { AuditLogger, getAuditLogger } from './audit-logger';
import {
  sanitizeObject,
  validateContent,
  ValidationResult,
  containsDangerousContent,
} from './sanitizer';
import {
  ContentVersion,
  OperationResult,
  AdminUser,
  AuditAction,
  ContentTypeRegistry,
  ContentTypeKey,
} from './types';
import { hasPermission, Permission, PermissionType } from './rbac';

// =============================================================================
// TYPES
// =============================================================================

export interface ContentServiceOptions {
  firestore: Firestore;
}

export interface SaveOptions {
  user: AdminUser;
  changeDescription?: string;
  expectedVersion?: number;
  publish?: boolean;
  skipValidation?: boolean;
  skipSanitization?: boolean;
}

export interface DeleteOptions {
  user: AdminUser;
  hardDelete?: boolean; // If true, permanently delete (requires super_admin)
}

export interface RollbackOptions {
  user: AdminUser;
  targetVersion: number;
}

// =============================================================================
// CONTENT SERVICE CLASS
// =============================================================================

export class ContentService {
  private firestore: Firestore;
  private versionManager: VersionManager;
  private auditLogger: AuditLogger;

  constructor(options: ContentServiceOptions) {
    this.firestore = options.firestore;
    this.versionManager = getVersionManager(options.firestore);
    this.auditLogger = getAuditLogger(options.firestore);
  }

  // ===========================================================================
  // PERMISSION CHECKS
  // ===========================================================================

  private checkPermission(user: AdminUser, permission: PermissionType): boolean {
    if (!user.isActive) return false;
    return hasPermission(user.role, permission);
  }

  private ensurePermission(user: AdminUser, permission: PermissionType): void {
    if (!this.checkPermission(user, permission)) {
      throw new Error(`Insufficient permissions: ${permission} required`);
    }
  }

  // ===========================================================================
  // CONTENT OPERATIONS
  // ===========================================================================

  /**
   * Get content from a document path
   */
  async getContent<T>(docPath: string): Promise<VersionedDocument<T> | null> {
    return this.versionManager.getCurrentContent<T>(docPath);
  }

  /**
   * Save content with full validation, sanitization, versioning, and audit logging
   */
  async saveContent<T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    content: T,
    options: SaveOptions
  ): Promise<OperationResult<{ version: number }>> {
    // Check permissions
    this.ensurePermission(options.user, Permission.CONTENT_UPDATE);

    // If publishing, check publish permission
    if (options.publish) {
      this.ensurePermission(options.user, Permission.CONTENT_PUBLISH);
    }

    // Get previous content for audit log
    const previousDoc = await this.getContent<T>(docPath);
    const previousContent = previousDoc?.content;

    // Validate content
    if (!options.skipValidation) {
      const validation = this.validateContentForType(contentType, content);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          errorCode: 'VALIDATION_ERROR',
        };
      }
    }

    // Sanitize content
    let sanitizedContent = content;
    if (!options.skipSanitization) {
      sanitizedContent = this.sanitizeContentForType(contentType, content);
      
      // Double-check for dangerous content after sanitization
      if (containsDangerousContent(JSON.stringify(sanitizedContent))) {
        return {
          success: false,
          error: 'Content contains potentially dangerous patterns',
          errorCode: 'DANGEROUS_CONTENT',
        };
      }
    }

    try {
      // Save with versioning
      const result = await this.versionManager.saveContent(
        docPath,
        contentType,
        sanitizedContent,
        {
          userId: options.user.id,
          userEmail: options.user.email,
          changeDescription: options.changeDescription,
          expectedVersion: options.expectedVersion,
          publish: options.publish,
        }
      );

      if (result.success && result.data) {
        // Log successful update
        await this.auditLogger.logContentUpdate(
          options.user.id,
          options.user.email,
          options.user.role,
          contentType,
          docPath,
          docPath,
          previousContent || {},
          sanitizedContent,
          true
        );
      }

      return result;
    } catch (error: any) {
      // Log failed update
      await this.auditLogger.logContentUpdate(
        options.user.id,
        options.user.email,
        options.user.role,
        contentType,
        docPath,
        docPath,
        previousContent || {},
        sanitizedContent,
        false,
        error.message
      );

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
  async rollbackContent<T extends Record<string, unknown>>(
    docPath: string,
    contentType: string,
    options: RollbackOptions
  ): Promise<OperationResult<{ version: number; restoredVersion: number }>> {
    // Check permissions
    this.ensurePermission(options.user, Permission.CONTENT_ROLLBACK);

    return this.versionManager.rollbackToVersion<T>(
      docPath,
      contentType,
      {
        userId: options.user.id,
        userEmail: options.user.email,
        targetVersion: options.targetVersion,
      },
      options.user.role
    );
  }

  /**
   * Soft delete content (mark as archived)
   */
  async deleteContent(
    docPath: string,
    contentType: string,
    options: DeleteOptions
  ): Promise<OperationResult> {
    // Check permissions
    this.ensurePermission(options.user, Permission.CONTENT_DELETE);

    try {
      const currentDoc = await this.getContent(docPath);
      
      if (!currentDoc) {
        return {
          success: false,
          error: 'Content not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (options.hardDelete) {
        // Hard delete requires super_admin
        this.ensurePermission(options.user, Permission.ADMIN_DELETE);
        
        const docRef = doc(this.firestore, docPath);
        await deleteDoc(docRef);
      } else {
        // Soft delete - mark as archived
        await this.versionManager.saveContent(
          docPath,
          contentType,
          { ...currentDoc.content, _deleted: true } as any,
          {
            userId: options.user.id,
            userEmail: options.user.email,
            changeDescription: 'Content archived',
          }
        );
      }

      // Log deletion
      await this.auditLogger.logContentDelete(
        options.user.id,
        options.user.email,
        options.user.role,
        contentType,
        docPath,
        docPath,
        currentDoc.content as Record<string, unknown>,
        true
      );

      return { success: true };
    } catch (error: any) {
      // Log failed deletion
      await this.auditLogger.logContentDelete(
        options.user.id,
        options.user.email,
        options.user.role,
        contentType,
        docPath,
        docPath,
        {},
        false,
        error.message
      );

      return {
        success: false,
        error: error.message || 'Failed to delete content',
        errorCode: error.code,
      };
    }
  }

  // ===========================================================================
  // VERSION OPERATIONS
  // ===========================================================================

  /**
   * Get version history for a document
   */
  async getVersionHistory(
    docPath: string,
    user: AdminUser,
    limit: number = 20
  ): Promise<ContentVersion[]> {
    this.ensurePermission(user, Permission.VERSION_READ);
    return this.versionManager.getVersionHistory(docPath, limit);
  }

  /**
   * Get a specific version
   */
  async getVersion(
    docPath: string,
    version: number,
    user: AdminUser
  ): Promise<ContentVersion | null> {
    this.ensurePermission(user, Permission.VERSION_READ);
    return this.versionManager.getVersion(docPath, version);
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    docPath: string,
    versionA: number,
    versionB: number,
    user: AdminUser
  ): Promise<{ versionA: ContentVersion | null; versionB: ContentVersion | null }> {
    this.ensurePermission(user, Permission.VERSION_READ);
    return this.versionManager.compareVersions(docPath, versionA, versionB);
  }

  // ===========================================================================
  // VALIDATION & SANITIZATION
  // ===========================================================================

  /**
   * Validate content based on content type
   */
  private validateContentForType(
    contentType: string,
    content: Record<string, unknown>
  ): ValidationResult {
    const typeConfig = ContentTypeRegistry[contentType as ContentTypeKey];
    
    if (!typeConfig) {
      // Generic validation for unknown types
      return validateContent(content);
    }

    try {
      typeConfig.schema.parse(content);
      return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Sanitize content based on content type
   */
  private sanitizeContentForType<T extends Record<string, unknown>>(
    contentType: string,
    content: T
  ): T {
    // Apply generic sanitization
    // In a full implementation, you'd have type-specific sanitization rules
    return sanitizeObject(content);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let contentServiceInstance: ContentService | null = null;

/**
 * Get or create the content service instance
 */
export function getContentService(firestore: Firestore): ContentService {
  if (!contentServiceInstance) {
    contentServiceInstance = new ContentService({ firestore });
  }
  return contentServiceInstance;
}
