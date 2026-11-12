// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE STORAGE SERVICE
// =============================================================================
// Implements the StorageService interface using Firebase Storage.

import {
  getStorage,
  ref,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { initializeFirebase, getFirebaseApp } from '../firebase';
import type {
  StorageService,
  UploadProgress,
  UploadResult,
  ImageUploadOptions,
} from '../interfaces';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

function validateFile(uri: string, options?: ImageUploadOptions): void {
  const maxSize = options?.maxSizeMB ?? MAX_FILE_SIZE_MB;
  const allowedTypes = options?.allowedTypes ?? ALLOWED_IMAGE_TYPES;

  // In a real implementation, you'd check the actual file
  // For now, we'll skip file validation on the client side
}

function getFileExtension(uri: string): string {
  const parts = uri.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1] : 'jpg';
  return (ext ?? 'jpg').toLowerCase();
}

function generateFileName(folder: string, fileName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = fileName ? getFileExtension(fileName) : 'jpg';
  return `${folder}/${timestamp}_${random}.${ext}`;
}

function createUploadResult(fullPath: string, downloadURL: string): UploadResult {
  return {
    url: downloadURL,
    path: fullPath,
    fullPath,
  };
}

async function uploadFileToStorage(
  uri: string,
  fullPath: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Initialize Firebase if not already done
  const app = getFirebaseApp();
  const storage = getStorage(app);
  const storageRef = ref(storage, fullPath);

  // For React Native, we need to convert the URI to a blob
  // This is a simplified implementation
  const response = await fetch(uri);
  const blob = await response.blob();

  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress: UploadProgress = {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        };
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(createUploadResult(fullPath, downloadURL));
      }
    );
  });
}

export const firebaseStorageService: StorageService = {
  async uploadFile(uri: string, options?: ImageUploadOptions): Promise<UploadResult> {
    validateFile(uri, options);
    const folder = options?.folder ?? 'uploads';
    const fullPath = generateFileName(folder, options?.fileName);
    return uploadFileToStorage(uri, fullPath, options?.onProgress);
  },

  async uploadFiles(uris: string[], options?: ImageUploadOptions): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const uri of uris) {
      const result = await this.uploadFile(uri, options);
      results.push(result);
    }
    return results;
  },

  async deleteFile(path: string): Promise<void> {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  async deleteFiles(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.deleteFile(path)));
  },

  async getFileUrl(path: string): Promise<string> {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  async uploadEventImages(
    uris: string[],
    eventId: string,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i]!;
      const result = await this.uploadFile(uri, {
        folder: 'events',
        fileName: `event_${eventId}_${i}`,
        onProgress: (progress) => onProgress?.(i, progress),
      });
      results.push(result);
    }
    return results;
  },

  async uploadProfileImage(uri: string, userId: string): Promise<UploadResult> {
    return this.uploadFile(uri, {
      folder: 'profiles',
      fileName: `profile_${userId}`,
    });
  },

  async deleteEventImages(imagePaths: string[]): Promise<void> {
    await this.deleteFiles(imagePaths);
  },
};

export default firebaseStorageService;