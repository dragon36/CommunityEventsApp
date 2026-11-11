// =============================================================================
// COMMUNITY EVENTS APP - FIREBASE STORAGE ADAPTER
// =============================================================================
// This file wraps the existing Firebase storage service to conform to the StorageService interface.

import { storageService } from './storage';
import type { StorageService } from '../interfaces';

export const firebaseStorageAdapter: StorageService = {
  uploadFile: storageService.uploadFile,
  uploadFiles: storageService.uploadFiles,
  deleteFile: storageService.deleteFile,
  deleteFiles: storageService.deleteFiles,
  getFileUrl: storageService.getFileUrl,
  uploadEventImages: storageService.uploadEventImages,
  uploadProfileImage: storageService.uploadProfileImage,
  deleteEventImages: storageService.deleteEventImages,
};

export default firebaseStorageAdapter;