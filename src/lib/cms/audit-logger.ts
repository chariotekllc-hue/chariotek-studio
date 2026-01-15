/**
 * @file Audit Logger Service
 * @description Centralized audit logging for all admin actions.
 * 
 * All admin operations must be logged for:
 * - Security auditing
 * - Compliance requirements
 * - Debugging and troubleshooting
 * - Activity monitoring
 * 
 * Logs are immutable and tamper-resistant (no update/delete via client).
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Firestore,
  Timestamp,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditLog,
  AuditAction,
  AuditActionType,
  UserRoleType,
  PaginatedResult,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const AUDIT_COLLECTION = 'audit_logs';
const MAX_VALUE_SIZE = 10000; // Max characters for stored values

// =============================================================================
// TYPES
// =============================================================================

export interface AuditLogInput {
  action: AuditActionType;
  userId: string;
  userEmail: string;
  userRole: UserRoleType;
  resourceType?: string;
  resourceId?: string;
  resourcePath?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQuery {
  userId?: string;
  action?: AuditActionType;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  lastDoc?: DocumentSnapshot;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Truncate large values to prevent oversized documents
 */
function truncateValue(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  
  const stringified = JSON.stringify(value);
  if (stringified.length <= MAX_VALUE_SIZE) {
    return value;
  }
  
  // Return truncated indicator
  return {
    _truncated: true,
    _originalSize: stringified.length,
    _preview: stringified.substring(0, 500) + '...',
  };
}

/**
 * Get client info for audit log (browser user agent, etc.)
 * Only available on client-side
 */
function getClientInfo(): { userAgent?: string } {
  if (typeof window === 'undefined') {
    return {};
  }
  
  return {
    userAgent: window.navigator?.userAgent,
  };
}

// =============================================================================
// AUDIT LOGGER CLASS
// =============================================================================

export class AuditLogger {
  private firestore: Firestore;
  
  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }
  
  /**
   * Log an audit event
   * 
   * @param input - The audit log input data
   * @returns Promise<string> - The ID of the created audit log
   */
  async log(input: AuditLogInput): Promise<string> {
    const clientInfo = getClientInfo();
    
    const auditLog: Omit<AuditLog, 'id'> = {
      id: uuidv4(),
      action: input.action,
      userId: input.userId,
      userEmail: input.userEmail,
      userRole: input.userRole,
      timestamp: Date.now(),
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourcePath: input.resourcePath,
      previousValue: truncateValue(input.previousValue),
      newValue: truncateValue(input.newValue),
      success: input.success,
      errorMessage: input.errorMessage,
      metadata: input.metadata,
      userAgent: clientInfo.userAgent,
    };
    
    try {
      const docRef = await addDoc(
        collection(this.firestore, AUDIT_COLLECTION),
        auditLog
      );
      return docRef.id;
    } catch (error) {
      // Fail silently for audit logs to not break main operations
      // but log to console for debugging
      console.error('[AuditLogger] Failed to write audit log:', error);
      return '';
    }
  }
  
  /**
   * Query audit logs with filters
   */
  async query(options: AuditLogQuery): Promise<PaginatedResult<AuditLog>> {
    const constraints: any[] = [];
    
    // Build query constraints
    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }
    
    if (options.action) {
      constraints.push(where('action', '==', options.action));
    }
    
    if (options.resourceType) {
      constraints.push(where('resourceType', '==', options.resourceType));
    }
    
    if (options.resourceId) {
      constraints.push(where('resourceId', '==', options.resourceId));
    }
    
    if (options.success !== undefined) {
      constraints.push(where('success', '==', options.success));
    }
    
    if (options.startDate) {
      constraints.push(where('timestamp', '>=', options.startDate.getTime()));
    }
    
    if (options.endDate) {
      constraints.push(where('timestamp', '<=', options.endDate.getTime()));
    }
    
    // Always order by timestamp descending
    constraints.push(orderBy('timestamp', 'desc'));
    
    // Pagination
    const pageLimit = options.limit || 50;
    constraints.push(limit(pageLimit + 1)); // +1 to check if there are more
    
    if (options.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }
    
    try {
      const q = query(collection(this.firestore, AUDIT_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const items: AuditLog[] = [];
      let lastDoc: DocumentSnapshot | undefined;
      
      snapshot.docs.forEach((doc, index) => {
        if (index < pageLimit) {
          items.push({ id: doc.id, ...doc.data() } as AuditLog);
          lastDoc = doc;
        }
      });
      
      return {
        items,
        total: items.length,
        hasMore: snapshot.docs.length > pageLimit,
      };
    } catch (error) {
      console.error('[AuditLogger] Failed to query audit logs:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
      };
    }
  }
  
  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================
  
  /**
   * Log a login event
   */
  async logLogin(userId: string, userEmail: string, userRole: UserRoleType, success: boolean, errorMessage?: string) {
    return this.log({
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      userId,
      userEmail,
      userRole,
      success,
      errorMessage,
    });
  }
  
  /**
   * Log a logout event
   */
  async logLogout(userId: string, userEmail: string, userRole: UserRoleType) {
    return this.log({
      action: AuditAction.LOGOUT,
      userId,
      userEmail,
      userRole,
      success: true,
    });
  }
  
  /**
   * Log content creation
   */
  async logContentCreate(
    userId: string,
    userEmail: string,
    userRole: UserRoleType,
    resourceType: string,
    resourceId: string,
    resourcePath: string,
    newValue: Record<string, unknown>,
    success: boolean,
    errorMessage?: string
  ) {
    return this.log({
      action: AuditAction.CONTENT_CREATE,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      resourcePath,
      newValue,
      success,
      errorMessage,
    });
  }
  
  /**
   * Log content update
   */
  async logContentUpdate(
    userId: string,
    userEmail: string,
    userRole: UserRoleType,
    resourceType: string,
    resourceId: string,
    resourcePath: string,
    previousValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    success: boolean,
    errorMessage?: string
  ) {
    return this.log({
      action: AuditAction.CONTENT_UPDATE,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      resourcePath,
      previousValue,
      newValue,
      success,
      errorMessage,
    });
  }
  
  /**
   * Log content deletion
   */
  async logContentDelete(
    userId: string,
    userEmail: string,
    userRole: UserRoleType,
    resourceType: string,
    resourceId: string,
    resourcePath: string,
    previousValue: Record<string, unknown>,
    success: boolean,
    errorMessage?: string
  ) {
    return this.log({
      action: AuditAction.CONTENT_DELETE,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      resourcePath,
      previousValue,
      success,
      errorMessage,
    });
  }
  
  /**
   * Log content rollback
   */
  async logContentRollback(
    userId: string,
    userEmail: string,
    userRole: UserRoleType,
    resourceType: string,
    resourceId: string,
    resourcePath: string,
    previousValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    fromVersion: number,
    toVersion: number,
    success: boolean,
    errorMessage?: string
  ) {
    return this.log({
      action: AuditAction.CONTENT_ROLLBACK,
      userId,
      userEmail,
      userRole,
      resourceType,
      resourceId,
      resourcePath,
      previousValue,
      newValue,
      success,
      errorMessage,
      metadata: {
        fromVersion,
        toVersion,
      },
    });
  }
  
  /**
   * Log admin user management
   */
  async logAdminManagement(
    action: 'create' | 'update' | 'delete' | 'role_change',
    performedBy: { userId: string; userEmail: string; userRole: UserRoleType },
    targetUser: { userId: string; userEmail: string },
    previousValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    success: boolean = true,
    errorMessage?: string
  ) {
    const actionMap = {
      create: AuditAction.ADMIN_CREATE,
      update: AuditAction.ADMIN_UPDATE,
      delete: AuditAction.ADMIN_DELETE,
      role_change: AuditAction.ADMIN_ROLE_CHANGE,
    };
    
    return this.log({
      action: actionMap[action],
      userId: performedBy.userId,
      userEmail: performedBy.userEmail,
      userRole: performedBy.userRole,
      resourceType: 'admin',
      resourceId: targetUser.userId,
      resourcePath: `adminUsers/${targetUser.userId}`,
      previousValue,
      newValue,
      success,
      errorMessage,
      metadata: {
        targetUserEmail: targetUser.userEmail,
      },
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE (created when needed)
// =============================================================================

let auditLoggerInstance: AuditLogger | null = null;

/**
 * Get or create the audit logger instance
 */
export function getAuditLogger(firestore: Firestore): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(firestore);
  }
  return auditLoggerInstance;
}
