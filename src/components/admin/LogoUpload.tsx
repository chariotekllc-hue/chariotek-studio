'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase/index';

// =============================================================================
// TYPES
// =============================================================================

interface LogoUploadProps {
  currentLogoUrl?: string;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
}

// =============================================================================
// VALIDATION
// =============================================================================

const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload a PNG, SVG, WebP, or GIF file for transparency support';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 2MB';
  }
  
  return null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LogoUpload({ currentLogoUrl, onUploadComplete, onUploadError }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleError = useCallback((message: string) => {
    setError(message);
    onUploadError?.(message);
  }, [onUploadError]);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      handleError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `logo-${timestamp}.${extension}`;
      const storagePath = `assets/${filename}`;

      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Upload with progress
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct);
        },
        (uploadError) => {
          console.error('Upload error:', uploadError);
          handleError('Failed to upload logo. Please try again.');
          setUploading(false);
          setPreviewUrl(null);
        },
        async () => {
          // Get download URL
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Delete old logo if it's from our storage
          if (currentLogoUrl && currentLogoUrl.includes('firebasestorage.googleapis.com')) {
            try {
              const oldRef = ref(storage, currentLogoUrl);
              await deleteObject(oldRef);
            } catch {
              // Ignore errors deleting old file
            }
          }

          setUploading(false);
          setProgress(100);
          onUploadComplete(downloadUrl);
        }
      );
    } catch (err) {
      console.error('Upload error:', err);
      handleError('Failed to upload logo. Please try again.');
      setUploading(false);
      setPreviewUrl(null);
    }
  }, [currentLogoUrl, handleError, onUploadComplete]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">
        Company Logo
      </label>
      
      {/* Current Logo Preview */}
      {displayUrl && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div 
            className="
              relative w-16 h-16 
              bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] 
              dark:bg-[repeating-conic-gradient(#333_0%_25%,transparent_0%_50%)]
              bg-[length:16px_16px]
              rounded-lg
              overflow-hidden
            "
          >
            <Image
              src={displayUrl}
              alt="Current logo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Current Logo</p>
            <p className="text-xs text-muted-foreground">
              {uploading ? `Uploading... ${progress}%` : 'Click or drag to replace'}
            </p>
          </div>
          {uploading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative
          border-2 border-dashed rounded-lg
          p-8
          text-center
          cursor-pointer
          transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.svg,.webp,.gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Uploading... {progress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, SVG, WebP, or GIF (max 2MB)
                </p>
                <p className="text-xs text-muted-foreground">
                  Square (1:1) aspect ratio recommended
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          <span>Use PNG or SVG with transparent background for best results</span>
        </p>
        <p>• Logo will be displayed at 40-48px, upload at least 96px for clarity</p>
        <p>• Any shape works - the logo will maintain its proportions</p>
      </div>
    </div>
  );
}

export default LogoUpload;
