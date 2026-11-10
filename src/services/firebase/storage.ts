import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
  StorageReference,
} from 'firebase/storage';
import { storage } from './config';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Storage Service
// ============================================

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export interface ImageUploadOptions {
  folder?: string; // 'events', 'profiles', etc.
  fileName?: string;
  onProgress?: (progress: UploadProgress) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

// Default configuration
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Upload a file to Firebase Storage
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
  const storageRef = ref(storage, path);

  // Convert URI to blob
  const blob = await uriToBlob(uri);

  // Upload with progress tracking
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: getMimeType(extension),
    });

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress,
          });
        }
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            path,
            fullPath: uploadTask.snapshot.ref.fullPath,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
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
    const fileOptions = {
      ...options,
      fileName: options.fileName ? `${options.fileName}_${i + 1}` : undefined,
    };
    const result = await uploadFile(uris[i], fileOptions);
    results.push(result);
  }

  return results;
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * Delete multiple files
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.map((path) => deleteFile(path)));
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
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
    // For React Native, we need to fetch the file to check size
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
    // If we can't validate, allow it (will fail at upload if invalid)
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
function getFileExtension(uri: string): string | null {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : null;
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
    const result = await uploadFile(uris[i], {
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

export const storageService = {
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteFiles,
  getFileUrl,
  uploadEventImages,
  uploadProfileImage,
  deleteEventImages,
};

export default storageService;