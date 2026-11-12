// =============================================================================
// COMMUNITY EVENTS APP - SUPABASE STORAGE ADAPTER
// =============================================================================

import { supabase } from './config';
import { v4 as uuidv4 } from 'uuid';
import type { UploadProgress, UploadResult, ImageUploadOptions, StorageService } from '../interfaces';

// Default configuration
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  uri: string,
  options: ImageUploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'uploads',
    fileName,
    onProgress,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  // Validate file
  await validateFile(uri, maxSizeMB, allowedTypes);

  // Generate unique file path
  const extension = getFileExtension(uri) || 'jpg';
  const name = fileName || `${uuidv4()}.${extension}`;
  const path = `${folder}/${name}`;

  // Convert URI to blob
  const blob = await uriToBlob(uri);

  // Upload with progress tracking
  // Note: Supabase JS client doesn't have built-in progress tracking for uploads
  // We'll simulate progress or use the lower-level fetch API
  const { data, error } = await supabase.storage.from('app-assets').upload(path, blob, {
    contentType: getMimeType(extension),
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Get public URL
  const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(data.path);

  if (onProgress) {
    // Simulate progress completion
    onProgress({ bytesTransferred: blob.size, totalBytes: blob.size, progress: 100 });
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
    fullPath: data.fullPath,
  };
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  uris: string[],
  options: ImageUploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    if (!uri) continue;

    const fileOptions = {
      ...options,
      fileName: options.fileName ? `${options.fileName}_${i + 1}` : undefined,
    };
    const result = await uploadFile(uri, fileOptions);
    results.push(result);
  }

  return results;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from('app-assets').remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Delete multiple files
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from('app-assets').remove(paths);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  const { data } = supabase.storage.from('app-assets').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate file size and type
 */
async function validateFile(
  uri: string,
  maxSizeMB: number,
  allowedTypes: string[]
): Promise<void> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    // Check size
    const sizeMB = blob.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      throw new Error(`File size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
    }

    // Check type
    if (!allowedTypes.includes(blob.type)) {
      throw new Error(`File type (${blob.type}) is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.warn('Could not validate file:', error);
  }
}

/**
 * Convert URI to Blob for upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}

/**
 * Get file extension from URI
 */
function getFileExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return 'jpg';
}

/**
 * Get MIME type from extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

// ============================================
// Specialized Upload Functions
// ============================================

/**
 * Upload event images
 */
export async function uploadEventImages(
  uris: string[],
  eventId: string,
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    if (!uri) continue;

    const result = await uploadFile(uri, {
      folder: `events/${eventId}`,
      onProgress: onProgress ? (p) => onProgress(i, p) : undefined,
    });
    results.push(result);
  }

  return results;
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(uri: string, userId: string): Promise<UploadResult> {
  return uploadFile(uri, {
    folder: `profiles/${userId}`,
    fileName: 'avatar',
  });
}

/**
 * Delete event images
 */
export async function deleteEventImages(imagePaths: string[]): Promise<void> {
  await deleteFiles(imagePaths);
}

export const supabaseStorageService = {
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteFiles,
  getFileUrl,
  uploadEventImages,
  uploadProfileImage,
  deleteEventImages,
};

export default supabaseStorageService;