import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const db = admin.firestore();
const storage = admin.storage();

interface ImageMetadata {
  uploadedBy: string;
  eventId?: string;
  type: 'event_cover' | 'event_gallery' | 'profile_avatar' | 'venue_photo';
  originalName: string;
}

export const processImageUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const bucketName = object.bucket;
    const filePath = object.name!;
    const contentType = object.contentType!;
    const metadata = object.metadata as unknown as ImageMetadata;

    // Only process images
    if (!contentType.startsWith('image/')) {
      return;
    }

    // Skip if already processed
    if (filePath.includes('_processed') || filePath.includes('_thumb')) {
      return;
    }

    const bucket = storage.bucket(bucketName);
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempDir = path.join(os.tmpdir(), 'image-processing');

    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Download file
      await bucket.file(filePath).download({ destination: tempFilePath });

      // Process based on type
      const processedFiles: { path: string; destination: string }[] = [];

      if (metadata.type === 'event_cover') {
        // Create multiple sizes for event cover
        const sizes = [
          { width: 1200, height: 600, suffix: '_large' },
          { width: 800, height: 400, suffix: '_medium' },
          { width: 400, height: 200, suffix: '_small' },
          { width: 200, height: 100, suffix: '_thumb' }
        ];

        for (const size of sizes) {
          const outputPath = path.join(tempDir, `${path.parse(fileName).name}${size.suffix}.webp`);
          await sharp(tempFilePath)
            .resize(size.width, size.height, { fit: 'cover', position: 'center' })
            .webp({ quality: 80 })
            .toFile(outputPath);
          processedFiles.push({ path: outputPath, destination: `${dirName}/${path.parse(fileName).name}${size.suffix}.webp` });
        }
      } else if (metadata.type === 'profile_avatar') {
        // Create square sizes for avatar
        const sizes = [
          { width: 400, height: 400, suffix: '_large' },
          { width: 200, height: 200, suffix: '_medium' },
          { width: 100, height: 100, suffix: '_small' },
          { width: 40, height: 40, suffix: '_tiny' }
        ];

        for (const size of sizes) {
          const outputPath = path.join(tempDir, `${path.parse(fileName).name}${size.suffix}.webp`);
          await sharp(tempFilePath)
            .resize(size.width, size.height, { fit: 'cover', position: 'center' })
            .webp({ quality: 85 })
            .toFile(outputPath);
          processedFiles.push({ path: outputPath, destination: `${dirName}/${path.parse(fileName).name}${size.suffix}.webp` });
        }
      } else {
        // Default: create thumbnail only
        const outputPath = path.join(tempDir, `${path.parse(fileName).name}_thumb.webp`);
        await sharp(tempFilePath)
          .resize(300, 300, { fit: 'inside' })
          .webp({ quality: 80 })
          .toFile(outputPath);
        processedFiles.push({ path: outputPath, destination: `${dirName}/${path.parse(fileName).name}_thumb.webp` });
      }

      // Upload processed files
      const uploadPromises = processedFiles.map(async ({ path: localPath, destination }) => {
        await bucket.upload(localPath, {
          destination,
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000',
            metadata: {
              ...metadata,
              processed: 'true',
              originalPath: filePath
            }
          }
        });
        // Make public if it's an event cover or venue photo
        if (metadata.type === 'event_cover' || metadata.type === 'venue_photo') {
          await bucket.file(destination).makePublic();
        }
      });

      await Promise.all(uploadPromises);

      // Update Firestore with processed image URLs
      if (metadata.eventId) {
        const eventRef = db.collection('events').doc(metadata.eventId);
        const eventDoc = await eventRef.get();

        if (eventDoc.exists) {
          const eventData = eventDoc.data()!;
          const imageUrls = processedFiles.map(f => {
            const file = bucket.file(f.destination);
            return `https://storage.googleapis.com/${bucketName}/${f.destination}`;
          });

          if (metadata.type === 'event_cover') {
            await eventRef.update({
              coverImageUrls: imageUrls,
              coverImageOriginal: `https://storage.googleapis.com/${bucketName}/${filePath}`
            });
          } else if (metadata.type === 'event_gallery') {
            await eventRef.update({
              galleryImages: admin.firestore.FieldValue.arrayUnion(...imageUrls)
            });
          }
        }
      } else if (metadata.type === 'profile_avatar') {
        const userRef = db.collection('users').doc(metadata.uploadedBy);
        const imageUrls = processedFiles.map(f => {
          return `https://storage.googleapis.com/${bucketName}/${f.destination}`;
        });

        await userRef.update({
          avatarUrls: imageUrls,
          avatarOriginal: `https://storage.googleapis.com/${bucketName}/${filePath}`
        });
      }

      // Clean up temp files
      for (const { path: localPath } of processedFiles) {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      functions.logger.info(`Processed image ${filePath} into ${processedFiles.length} variants`);
    } catch (error) {
      functions.logger.error(`Error processing image ${filePath}:`, error);
      throw error;
    }
  });