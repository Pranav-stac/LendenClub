/**
 * AWS S3 Client Configuration
 * Handles all S3 operations for media uploads with highly organized folder structure
 * 
 * Folder Structure (Date-first organization):
 * workspaces/{workspaceId}/
 * ├── general/
 * │   ├── {year}/{month}/{day}/
 * │   │   ├── images/{filename}
 * │   │   ├── videos/{filename}
 * │   │   └── documents/{filename}
 * │   └── _special/
 * │       ├── avatars/{filename}
 * │       ├── banners/{filename}
 * │       └── thumbnails/{filename}
 * └── clients/{clientId}/
 *     ├── _shared/
 *     │   ├── {year}/{month}/{day}/
 *     │   │   ├── images/{filename}
 *     │   │   ├── videos/{filename}
 *     │   │   └── documents/{filename}
 *     │   └── _special/
 *     └── brands/{brandId}/
 *         ├── {year}/{month}/{day}/
 *         │   ├── images/{filename}
 *         │   ├── videos/{filename}
 *         │   └── documents/{filename}
 *         └── _special/
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';

// Validate AWS credentials before initializing client
function validateAwsCredentials() {
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey || 
      config.aws.accessKeyId === '' || config.aws.secretAccessKey === '') {
    throw new Error(
      'AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables. ' +
      'See server/env.example.txt for configuration details. ' +
      'Note: S3 functionality requires valid AWS credentials to upload media files.'
    );
  }
  if (!config.aws.region || config.aws.region === '') {
    throw new Error('AWS_REGION is not configured. Please set AWS_REGION environment variable (e.g., "us-east-1", "ap-south-1").');
  }
  if (!config.aws.s3Bucket || config.aws.s3Bucket === '') {
    throw new Error('AWS_S3_BUCKET is not configured. Please set AWS_S3_BUCKET environment variable.');
  }
}

// Skip S3 validation when using local storage (no AWS credentials needed)
// In development, we'll allow empty credentials but warn
const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true' || process.env.USE_LOCAL_STORAGE === '1';
if (process.env.NODE_ENV === 'production' && !useLocalStorage) {
  validateAwsCredentials();
}

// Initialize S3 Client
// Note: If credentials are empty/invalid, AWS SDK will throw an error when used
export const s3Client = new S3Client({
  region: config.aws.region || 'us-east-1',
  credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  } : undefined,
});

export const S3_BUCKET = config.aws.s3Bucket;

/**
 * Media categories for organization
 */
export type MediaCategory = 
  | 'images/photos'      // Regular photos
  | 'images/graphics'    // Graphics, logos, designs
  | 'images/thumbnails'  // Generated thumbnails
  | 'images/avatars'     // Profile pictures
  | 'images/banners'     // Cover images, banners
  | 'videos/posts'       // Videos for social posts
  | 'videos/stories'     // Story format videos
  | 'videos/reels'       // Short-form reels
  | 'videos/thumbnails'  // Video thumbnails
  | 'documents/pdfs'     // PDF documents
  | 'documents/reports'  // Analytics reports
  | 'documents/exports'; // Exported data

/**
 * Get current date parts for folder structure
 */
function getDateParts(): { year: string; month: string; day: string } {
  const now = new Date();
  return {
    year: now.getFullYear().toString(),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
  };
}

/**
 * Determine media category from mime type and optional hint
 */
export function getMediaCategory(mimeType: string, hint?: string): MediaCategory {
  if (mimeType.startsWith('image/')) {
    if (hint === 'avatar') return 'images/avatars';
    if (hint === 'banner' || hint === 'cover') return 'images/banners';
    if (hint === 'thumbnail') return 'images/thumbnails';
    if (hint === 'graphic' || hint === 'logo') return 'images/graphics';
    return 'images/photos';
  }
  
  if (mimeType.startsWith('video/')) {
    if (hint === 'story') return 'videos/stories';
    if (hint === 'reel' || hint === 'short') return 'videos/reels';
    if (hint === 'thumbnail') return 'videos/thumbnails';
    return 'videos/posts';
  }
  
  if (mimeType === 'application/pdf') {
    if (hint === 'report') return 'documents/reports';
    if (hint === 'export') return 'documents/exports';
    return 'documents/pdfs';
  }
  
  return 'documents/pdfs';
}

/**
 * Generate highly organized S3 key
 * 
 * Structure (Date-first organization):
 * {bucket}/
 * └── workspaces/
 *     └── {workspaceId}/
 *         ├── general/
 *         │   ├── {year}/{month}/{day}/
 *         │   │   ├── images/{filename}
 *         │   │   ├── videos/{filename}
 *         │   │   └── documents/{filename}
 *         │   └── _special/ (for avatars, banners, thumbnails without dates)
 *         │       ├── avatars/{filename}
 *         │       ├── banners/{filename}
 *         │       └── thumbnails/{filename}
 *         └── clients/
 *             └── {clientId}/
 *                 ├── _shared/
 *                 │   ├── {year}/{month}/{day}/
 *                 │   │   ├── images/{filename}
 *                 │   │   ├── videos/{filename}
 *                 │   │   └── documents/{filename}
 *                 │   └── _special/
 *                 └── brands/
 *                     └── {brandId}/
 *                         ├── {year}/{month}/{day}/
 *                         │   ├── images/{filename}
 *                         │   ├── videos/{filename}
 *                         │   └── documents/{filename}
 *                         └── _special/
 */
export function generateS3Key(options: {
  workspaceId: string;
  clientId?: string;
  brandId?: string;
  category: MediaCategory;
  filename: string;
  includeDatePath?: boolean;
}): string {
  const { workspaceId, clientId, brandId, category, filename, includeDatePath = true } = options;
  const { year, month, day } = getDateParts();
  
  // Build base path
  let path = `workspaces/${workspaceId}`;
  
  // Add client/brand path or general
  if (clientId && brandId) {
    path += `/clients/${clientId}/brands/${brandId}`;
  } else if (clientId) {
    path += `/clients/${clientId}/_shared`;
  } else {
    path += '/general';
  }
  
  // Determine if this is a special category (avatar, banner, thumbnail) that doesn't need date
  const isSpecialCategory = category.includes('avatar') || 
                           category.includes('banner') || 
                           category.includes('thumbnail');
  
  // Determine media type folder (images, videos, documents)
  let mediaTypeFolder = 'documents';
  if (category.startsWith('images/')) {
    mediaTypeFolder = 'images';
  } else if (category.startsWith('videos/')) {
    mediaTypeFolder = 'videos';
  }
  
  // Build path: Date-first structure for regular content
  if (includeDatePath && !isSpecialCategory) {
    // Regular content: date folder first, then media type
    path += `/${year}/${month}/${day}/${mediaTypeFolder}`;
  } else {
    // Special content (avatars, banners, thumbnails): put in _special folder
    path += '/_special';
    
    // For special categories, use the subcategory name (avatar, banner, thumbnail)
    if (category.includes('avatar')) {
      path += '/avatars';
    } else if (category.includes('banner')) {
      path += '/banners';
    } else if (category.includes('thumbnail')) {
      path += '/thumbnails';
    } else {
      // Fallback to media type if not a recognized special category
      path += `/${mediaTypeFolder}`;
    }
  }
  
  path += `/${filename}`;
  
  return path;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  // Validate credentials before attempting upload
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey || 
      config.aws.accessKeyId === '' || config.aws.secretAccessKey === '') {
    throw new Error(
      'AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables. ' +
      'See server/env.example.txt for configuration details.'
    );
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
    Metadata: metadata,
    // Cache control for different file types
    CacheControl: contentType.startsWith('image/') 
      ? 'public, max-age=31536000' // 1 year for images
      : contentType.startsWith('video/')
        ? 'public, max-age=86400' // 1 day for videos
        : 'public, max-age=3600', // 1 hour for documents
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${S3_BUCKET}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Delete multiple files from S3 (by prefix/folder)
 */
export async function deleteS3Folder(prefix: string): Promise<void> {
  // List all objects with prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: prefix,
  });

  const listResult = await s3Client.send(listCommand);
  
  if (listResult.Contents) {
    // Delete each object
    await Promise.all(
      listResult.Contents.map(obj => 
        obj.Key ? deleteFromS3(obj.Key) : Promise.resolve()
      )
    );
  }
}

/**
 * Get signed URL for private file access
 */
export async function getS3SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  const match = url.match(/amazonaws\.com\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get folder path from S3 key
 */
export function getFolderFromKey(key: string): string {
  const parts = key.split('/');
  parts.pop(); // Remove filename
  return parts.join('/');
}

/**
 * List files in a specific S3 folder
 */
export async function listS3Folder(prefix: string, maxKeys = 100): Promise<{
  files: { key: string; size: number; lastModified: Date }[];
  hasMore: boolean;
}> {
  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const result = await s3Client.send(command);
  
  return {
    files: (result.Contents || []).map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
    })),
    hasMore: result.IsTruncated || false,
  };
}

/**
 * Get S3 URL for a key
 */
export function getS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${config.aws.region}.amazonaws.com/${key}`;
}
