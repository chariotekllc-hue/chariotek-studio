/**
 * @file Input Sanitization Utilities
 * @description Security-focused input sanitization for CMS content.
 * 
 * Key protections:
 * - XSS prevention
 * - Script injection blocking
 * - URL validation
 * - HTML sanitization
 * - Content length limits
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum allowed lengths for various content types
 */
export const ContentLimits = {
  TITLE: 200,
  TAGLINE: 300,
  DESCRIPTION: 2000,
  BODY_TEXT: 50000,
  URL: 2048,
  EMAIL: 320,
  PHONE: 30,
  ADDRESS: 500,
  LEGAL_TEXT: 100000,
} as const;

/**
 * Allowed URL protocols
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Patterns that indicate potential XSS attacks
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, onerror, etc.
  /data:\s*text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<form\b/gi,
  /<input\b/gi,
  /<button\b/gi,
  /document\.(cookie|write|location)/gi,
  /window\.(location|open)/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
];

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return input.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
}

/**
 * Check if a string contains dangerous patterns
 */
export function containsDangerousContent(input: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Remove dangerous content from a string
 */
export function removeDangerousContent(input: string): string {
  let result = input;
  
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }
  
  return result;
}

/**
 * Sanitize plain text input
 * - Trims whitespace
 * - Removes dangerous patterns
 * - Enforces length limit
 */
export function sanitizeText(
  input: string | undefined | null,
  maxLength: number = ContentLimits.DESCRIPTION
): string {
  if (!input) return '';
  
  let result = input.trim();
  
  // Remove dangerous content
  result = removeDangerousContent(result);
  
  // Normalize whitespace (but preserve newlines for multi-line text)
  result = result.replace(/[\t\f\v]+/g, ' ');
  result = result.replace(/ +/g, ' ');
  
  // Enforce length limit
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result;
}

/**
 * Sanitize a title (single line, no HTML)
 */
export function sanitizeTitle(input: string | undefined | null): string {
  if (!input) return '';
  
  // Remove all newlines and extra whitespace
  let result = input.trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  
  // Remove dangerous content
  result = removeDangerousContent(result);
  
  // Escape HTML
  result = escapeHtml(result);
  
  // Enforce length limit
  if (result.length > ContentLimits.TITLE) {
    result = result.substring(0, ContentLimits.TITLE);
  }
  
  return result;
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(input: string | undefined | null): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  if (!trimmed) return '';
  
  try {
    const url = new URL(trimmed);
    
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      console.warn(`[Sanitizer] Blocked URL with protocol: ${url.protocol}`);
      return '';
    }
    
    // Check for dangerous patterns in URL
    if (containsDangerousContent(trimmed)) {
      console.warn('[Sanitizer] Blocked URL with dangerous content');
      return '';
    }
    
    // Enforce length limit
    if (trimmed.length > ContentLimits.URL) {
      console.warn('[Sanitizer] URL exceeds maximum length');
      return '';
    }
    
    return trimmed;
  } catch {
    // Invalid URL
    console.warn('[Sanitizer] Invalid URL format');
    return '';
  }
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(input: string | undefined | null): string {
  if (!input) return '';
  
  const trimmed = input.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  if (trimmed.length > ContentLimits.EMAIL) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize a phone number
 */
export function sanitizePhone(input: string | undefined | null): string {
  if (!input) return '';
  
  // Allow only digits, spaces, dashes, parentheses, and plus sign
  let result = input.replace(/[^0-9\s\-()+ ]/g, '');
  result = result.trim();
  
  if (result.length > ContentLimits.PHONE) {
    result = result.substring(0, ContentLimits.PHONE);
  }
  
  return result;
}

/**
 * Sanitize rich text / markdown content
 * Allows safe formatting but removes dangerous elements
 */
export function sanitizeRichText(
  input: string | undefined | null,
  maxLength: number = ContentLimits.BODY_TEXT
): string {
  if (!input) return '';
  
  let result = input;
  
  // Remove dangerous script-related content
  result = removeDangerousContent(result);
  
  // Remove dangerous HTML tags but allow safe formatting
  // This is a basic implementation - in production, use a library like DOMPurify
  const dangerousTags = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  ];
  
  for (const pattern of dangerousTags) {
    result = result.replace(pattern, '');
  }
  
  // Remove event handlers from any remaining HTML
  result = result.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Enforce length limit
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result.trim();
}

// =============================================================================
// OBJECT SANITIZATION
// =============================================================================

/**
 * Recursively sanitize an object's string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldRules?: Record<string, 'text' | 'title' | 'url' | 'email' | 'phone' | 'richText' | 'skip'>
): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }
    
    if (typeof value === 'string') {
      const rule = fieldRules?.[key] || 'text';
      
      switch (rule) {
        case 'skip':
          result[key] = value;
          break;
        case 'title':
          result[key] = sanitizeTitle(value);
          break;
        case 'url':
          result[key] = sanitizeUrl(value);
          break;
        case 'email':
          result[key] = sanitizeEmail(value);
          break;
        case 'phone':
          result[key] = sanitizePhone(value);
          break;
        case 'richText':
          result[key] = sanitizeRichText(value);
          break;
        default:
          result[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeText(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>, fieldRules);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>, fieldRules);
    } else {
      // Numbers, booleans, etc. - pass through
      result[key] = value;
    }
  }
  
  return result as T;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate content before saving
 */
export function validateContent(
  content: Record<string, unknown>,
  requiredFields: string[] = []
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    const value = content[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field} is required`);
    }
  }
  
  // Check for dangerous content
  const contentString = JSON.stringify(content);
  if (containsDangerousContent(contentString)) {
    warnings.push('Content contains potentially dangerous patterns that will be sanitized');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create a sanitization function for a specific content type
 */
export function createContentSanitizer<T extends Record<string, unknown>>(
  fieldRules: Record<keyof T, 'text' | 'title' | 'url' | 'email' | 'phone' | 'richText' | 'skip'>
) {
  return (content: T): T => {
    return sanitizeObject(content, fieldRules as Record<string, any>);
  };
}

// =============================================================================
// CONTENT-SPECIFIC SANITIZERS
// =============================================================================

/**
 * Sanitize site configuration content
 */
export const sanitizeSiteConfig = createContentSanitizer({
  companyName: 'title',
  tagline: 'text',
  email: 'email',
  phone: 'phone',
  address: 'text',
  logo: 'url',
});

/**
 * Sanitize social links content
 */
export const sanitizeSocialLinks = createContentSanitizer({
  linkedin: 'url',
  github: 'url',
  twitter: 'url',
  instagram: 'url',
  youtube: 'url',
  facebook: 'url',
});

/**
 * Sanitize hero content
 */
export const sanitizeHeroContent = createContentSanitizer({
  title: 'title',
  tagline: 'text',
  description: 'text',
  background: 'url',
  ctaPrimary: 'text',
  ctaPrimaryLink: 'url',
  ctaSecondary: 'text',
  ctaSecondaryLink: 'url',
});

/**
 * Sanitize legal content
 */
export const sanitizeLegalContent = createContentSanitizer({
  termsOfService: 'richText',
  privacyPolicy: 'richText',
  disclaimer: 'richText',
  cookiePolicy: 'richText',
  lastUpdated: 'skip',
});
