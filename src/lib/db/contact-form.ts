/**
 * Contact Form Database Operations
 * 
 * Handles contact form submissions stored in Firestore.
 * Public users can submit, admins can read and manage.
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '@/firebase/index';

// =============================================================================
// TYPES
// =============================================================================

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  submittedAt: number;
  source?: string;
  isRead?: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  source?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{10,20}$/;

/**
 * Validate contact form data
 */
export function validateContactForm(data: ContactFormData): string[] {
  const errors: string[] = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name is too long');
  }

  // Email validation
  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  // Phone validation (optional)
  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    errors.push('Please enter a valid phone number');
  }

  // Subject validation
  if (!data.subject || data.subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters');
  }
  if (data.subject && data.subject.length > 200) {
    errors.push('Subject is too long');
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }
  if (data.message && data.message.length > 5000) {
    errors.push('Message is too long (max 5000 characters)');
  }

  // Company validation (optional)
  if (data.company && data.company.length > 200) {
    errors.push('Company name is too long');
  }

  return errors;
}

/**
 * Sanitize contact form input
 */
function sanitizeInput(text: string): string {
  return text
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS injection attempts
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

const COLLECTION_NAME = 'contact_submissions';

/**
 * Submit a contact form (public access)
 * 
 * @param data - Contact form data
 * @returns Promise with submission ID
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<string> {
  // Validate
  const errors = validateContactForm(data);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  // Sanitize
  const sanitizedData: ContactSubmission = {
    name: sanitizeInput(data.name),
    email: sanitizeInput(data.email).toLowerCase(),
    phone: data.phone ? sanitizeInput(data.phone) : undefined,
    company: data.company ? sanitizeInput(data.company) : undefined,
    subject: sanitizeInput(data.subject),
    message: sanitizeInput(data.message),
    source: data.source ? sanitizeInput(data.source) : 'website',
    submittedAt: Date.now(),
    isRead: false
  };

  // Remove undefined fields
  Object.keys(sanitizedData).forEach(key => {
    if (sanitizedData[key as keyof ContactSubmission] === undefined) {
      delete sanitizedData[key as keyof ContactSubmission];
    }
  });

  // Submit to Firestore
  const docRef = await addDoc(
    collection(firestore, COLLECTION_NAME),
    sanitizedData
  );

  return docRef.id;
}

/**
 * Get all contact submissions (admin only)
 * 
 * @param limitCount - Maximum number of submissions to return
 * @returns Promise with array of submissions
 */
export async function getContactSubmissions(
  limitCount = 100
): Promise<ContactSubmission[]> {
  const q = query(
    collection(firestore, COLLECTION_NAME),
    orderBy('submittedAt', 'desc'),
    firestoreLimit(limitCount)
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ContactSubmission[];
}

/**
 * Delete a contact submission (admin only)
 * 
 * @param submissionId - ID of the submission to delete
 */
export async function deleteContactSubmission(
  submissionId: string
): Promise<void> {
  await deleteDoc(doc(firestore, COLLECTION_NAME, submissionId));
}

/**
 * Mark a submission as read (admin only)
 */
export async function markSubmissionAsRead(
  submissionId: string
): Promise<void> {
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(firestore, COLLECTION_NAME, submissionId), {
    isRead: true
  });
}
