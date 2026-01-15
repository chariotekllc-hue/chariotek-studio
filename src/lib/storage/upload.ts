/**
 * Cloud Storage Upload Utilities
 * 
 * Provides secure file upload functionality for admins.
 */

import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  UploadMetadata,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@/firebase/index';

// =============================================================================
// TYPES
// =============================================================================

export interface UploadOptions {
  /** Storage path (e.g., 'content/hero') */
  path: string;
  /** Custom filename (defaults to original) */
  filename?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  /** Download URL for the uploaded file */
  url: string;
  /** Full storage path */
  path: string;
  /** File size in bytes */
  size: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate a file before upload
 */
export function validateFile(file: File, allowDocuments = false): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
  }

  // Check file type
  const allowedTypes = allowDocuments 
    ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    : ALLOWED_IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed`;
  }

  // Check filename for special characters
  if (/[<>:"/\\|?*]/.test(file.name)) {
    return 'Filename contains invalid characters';
  }

  return null;
}

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Generate a safe filename
 */
function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
    .replace(/-+/g, '-') // Collapse multiple dashes
    .substring(0, 50); // Limit length

  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Upload a file with progress tracking
 * 
 * @param file - File to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate file
  const error = validateFile(file);
  if (error) {
    throw new Error(error);
  }

  // Generate filename
  const filename = options.filename || generateSafeFilename(file.name);
  const fullPath = `${options.path}/${filename}`;

  // Create storage reference
  const storageRef = ref(storage, fullPath);

  // Prepare metadata
  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      ...options.metadata
    }
  };

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        options.onProgress?.(progress);
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            path: fullPath,
            size: file.size
          });
        } catch (err) {
          reject(new Error('Failed to get download URL'));
        }
      }
    );
  });
}

/**
 * Upload an image to the content folder
 * 
 * @param file - Image file
 * @param category - Content category (e.g., 'hero', 'portfolio')
 * @param onProgress - Progress callback
 */
export async function uploadContentImage(
  file: File,
  category: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadFile(file, {
    path: `content/${category}`,
    onProgress
  });
}

/**
 * Upload an asset (logo, favicon, etc.)
 * 
 * @param file - Asset file
 * @param name - Asset name
 */
export async function uploadAsset(
  file: File,
  name: string
): Promise<UploadResult> {
  return uploadFile(file, {
    path: 'assets',
    filename: name
  });
}

/**
 * Delete a file from storage
 * 
 * @param path - Full storage path
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

/**
 * Compress an image before upload
 * 
 * @param file - Image file
 * @param maxWidth - Maximum width
 * @param quality - JPEG quality (0-1)
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }

          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}
