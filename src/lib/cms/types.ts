/**
 * @file CMS Type Definitions
 * @description Core types for the Content Management System with versioning and audit support.
 * 
 * This file defines the foundational types for:
 * - Content documents with versioning metadata
 * - User roles and permissions (RBAC)
 * - Audit log entries
 * - Content operations
 */

import { z } from 'zod';

// =============================================================================
// USER ROLES & PERMISSIONS
// =============================================================================

/**
 * User roles in the system following RBAC principles
 * - super_admin: Full access, can manage admins, delete content permanently
 * - admin: Can edit/publish all content, cannot manage other admins
 * - editor: Can edit content, but changes require admin approval (optional)
 */
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Permission types for granular access control
 */
export const Permission = {
  // Content permissions
  CONTENT_READ: 'content:read',
  CONTENT_CREATE: 'content:create',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',
  CONTENT_ROLLBACK: 'content:rollback',
  
  // Admin management permissions
  ADMIN_READ: 'admin:read',
  ADMIN_CREATE: 'admin:create',
  ADMIN_UPDATE: 'admin:update',
  ADMIN_DELETE: 'admin:delete',
  
  // Audit log permissions
  AUDIT_READ: 'audit:read',
  
  // Version permissions
  VERSION_READ: 'version:read',
  VERSION_RESTORE: 'version:restore',
} as const;

export type PermissionType = typeof Permission[keyof typeof Permission];

/**
 * Role to permissions mapping
 */
export const RolePermissions: Record<UserRoleType, PermissionType[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.CONTENT_ROLLBACK,
    Permission.ADMIN_READ,
    Permission.AUDIT_READ,
    Permission.VERSION_READ,
    Permission.VERSION_RESTORE,
  ],
  [UserRole.EDITOR]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.VERSION_READ,
  ],
};

// =============================================================================
// ADMIN USER SCHEMA
// =============================================================================

export const AdminUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  displayName: z.string().optional(),
  role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR]),
  createdAt: z.number(), // Unix timestamp
  createdBy: z.string(),
  updatedAt: z.number().optional(),
  updatedBy: z.string().optional(),
  lastLoginAt: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

// =============================================================================
// CONTENT VERSIONING
// =============================================================================

/**
 * Content status for workflow management
 */
export const ContentStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ContentStatusType = typeof ContentStatus[keyof typeof ContentStatus];

/**
 * Base metadata attached to all versioned content
 */
export const ContentMetadataSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.string(), // Content type identifier (e.g., 'hero', 'about', 'footer')
  version: z.number().int().positive(),
  status: z.enum([ContentStatus.DRAFT, ContentStatus.PUBLISHED, ContentStatus.ARCHIVED]),
  createdAt: z.number(),
  createdBy: z.string(),
  updatedAt: z.number(),
  updatedBy: z.string(),
  publishedAt: z.number().optional(),
  publishedBy: z.string().optional(),
});

export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;

/**
 * Version snapshot stored in version history
 */
export const ContentVersionSchema = z.object({
  versionId: z.string(),
  version: z.number().int().positive(),
  contentSnapshot: z.record(z.unknown()), // Full content at this version
  createdAt: z.number(),
  createdBy: z.string(),
  createdByEmail: z.string().optional(),
  changeDescription: z.string().optional(),
  isRollback: z.boolean().default(false),
  rolledBackFrom: z.number().optional(), // Version number this was rolled back from
});

export type ContentVersion = z.infer<typeof ContentVersionSchema>;

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Audit action types for tracking all admin operations
 */
export const AuditAction = {
  // Auth actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  
  // Content actions
  CONTENT_CREATE: 'content_create',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CONTENT_PUBLISH: 'content_publish',
  CONTENT_UNPUBLISH: 'content_unpublish',
  CONTENT_ROLLBACK: 'content_rollback',
  
  // Admin management actions
  ADMIN_CREATE: 'admin_create',
  ADMIN_UPDATE: 'admin_update',
  ADMIN_DELETE: 'admin_delete',
  ADMIN_ROLE_CHANGE: 'admin_role_change',
  
  // System actions
  SETTINGS_UPDATE: 'settings_update',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * Audit log entry schema
 */
export const AuditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  userRole: z.string(),
  timestamp: z.number(),
  resourceType: z.string().optional(), // e.g., 'content', 'admin', 'settings'
  resourceId: z.string().optional(),
  resourcePath: z.string().optional(), // Firestore path
  previousValue: z.record(z.unknown()).optional(),
  newValue: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// =============================================================================
// CONTENT TYPE SCHEMAS
// =============================================================================

/**
 * Site configuration content schema
 */
export const SiteConfigContentSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  tagline: z.string().max(200).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  logo: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type SiteConfigContent = z.infer<typeof SiteConfigContentSchema>;

/**
 * Social links content schema
 */
export const SocialLinksContentSchema = z.object({
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type SocialLinksContent = z.infer<typeof SocialLinksContentSchema>;

/**
 * Footer content schema
 */
export const FooterContentSchema = z.object({
  copyright: z.string().min(1, 'Copyright is required').max(200),
  governingLaw: z.string().min(1, 'Governing law is required').max(100),
  additionalText: z.string().max(500).optional(),
});

export type FooterContent = z.infer<typeof FooterContentSchema>;

/**
 * Hero section content schema
 */
export const HeroContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  background: z.string().url('Invalid URL').optional().or(z.literal('')),
  ctaPrimary: z.string().max(50).optional(),
  ctaPrimaryLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  ctaSecondary: z.string().max(50).optional(),
  ctaSecondaryLink: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type HeroContent = z.infer<typeof HeroContentSchema>;

/**
 * Domain/service item schema
 */
export const DomainItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100),
  desc: z.string().min(1, 'Description is required').max(500),
  icon: z.string().optional(),
  order: z.number().int().optional(),
});

export type DomainItem = z.infer<typeof DomainItemSchema>;

/**
 * About page content schema
 */
export const AboutContentSchema = z.object({
  heroTitle: z.string().min(1).max(100),
  heroSubtitle: z.string().max(500).optional(),
  heroBackground: z.string().url().optional().or(z.literal('')),
  missionTitle: z.string().max(100).optional(),
  missionStatement: z.string().max(1000).optional(),
  visionTitle: z.string().max(100).optional(),
  visionStatement: z.string().max(1000).optional(),
  teamTitle: z.string().max(100).optional(),
  teamDescription: z.string().max(1000).optional(),
});

export type AboutContent = z.infer<typeof AboutContentSchema>;

/**
 * Value item schema for About page
 */
export const ValueItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  desc: z.string().min(1).max(500),
  order: z.number().int().optional(),
});

export type ValueItem = z.infer<typeof ValueItemSchema>;

/**
 * Legal content schema
 */
export const LegalContentSchema = z.object({
  termsOfService: z.string().max(50000).optional(),
  privacyPolicy: z.string().max(50000).optional(),
  disclaimer: z.string().max(10000).optional(),
  cookiePolicy: z.string().max(10000).optional(),
  lastUpdated: z.number().optional(),
});

export type LegalContent = z.infer<typeof LegalContentSchema>;

// =============================================================================
// CONTENT TYPE REGISTRY
// =============================================================================

/**
 * Registry of all content types with their schemas and collection paths
 */
export const ContentTypeRegistry = {
  'site-config': {
    schema: SiteConfigContentSchema,
    collectionPath: 'sites/singleton',
    displayName: 'Site Configuration',
  },
  'social-links': {
    schema: SocialLinksContentSchema,
    collectionPath: 'sites/singleton/socials/singleton',
    displayName: 'Social Media Links',
  },
  'footer': {
    schema: FooterContentSchema,
    collectionPath: 'sites/singleton/footer/singleton',
    displayName: 'Footer',
  },
  'hero': {
    schema: HeroContentSchema,
    collectionPath: 'homes/singleton/hero/singleton',
    displayName: 'Hero Section',
  },
  'about': {
    schema: AboutContentSchema,
    collectionPath: 'about/singleton',
    displayName: 'About Page',
  },
  'legal': {
    schema: LegalContentSchema,
    collectionPath: 'legals/singleton',
    displayName: 'Legal Pages',
  },
} as const;

export type ContentTypeKey = keyof typeof ContentTypeRegistry;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic wrapper for content with metadata
 */
export interface VersionedContent<T> {
  content: T;
  metadata: ContentMetadata;
}

/**
 * Result type for operations that may fail
 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}
