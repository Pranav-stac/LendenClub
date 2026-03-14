/**
 * Media Service
 * Handles all media uploads to AWS S3 with highly organized folder structure
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

import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import path from 'path';
import { 
  uploadToS3, 
  deleteFromS3, 
  getS3SignedUrl, 
  generateS3Key, 
  extractS3KeyFromUrl,
  getMediaCategory,
  MediaCategory,
  getS3Url,
} from '../../lib/s3.js';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadOptions {
  workspaceId: string;
  userId: string;
  clientId?: string;
  brandId?: string;
  category?: string; // Hint for categorization: 'avatar', 'banner', 'story', 'reel', etc.
}

export class MediaService {
  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private generateFileName(originalName: string): string {
    const ext = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const random = nanoid(8);
    // Clean the original name for use in the filename
    const cleanName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)
      .toLowerCase();
    return `${cleanName}-${timestamp}-${random}${ext}`;
  }

  private getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    return 'DOCUMENT';
  }

  async upload(file: UploadedFile, options: UploadOptions) {
    let { workspaceId, userId, clientId, brandId, category: categoryHint } = options;

    // If brandId is provided but clientId is not, look up the brand to get its clientId
    // This ensures files uploaded for brands go to the correct folder structure
    if (brandId && !clientId) {
      try {
        const brand = await prisma.brand.findUnique({
          where: { id: brandId },
          select: { clientId: true },
        });
        if (brand) {
          clientId = brand.clientId;
        } else {
          throw new Error('Brand not found');
        }
      } catch (error) {
        throw new Error(`Failed to find brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/mov', 'video/mkv',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }

    // Validate file size
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    const maxSize = isVideo ? 500 * 1024 * 1024 : isImage ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      throw new Error(`File size exceeds ${maxMB}MB limit for ${isVideo ? 'videos' : isImage ? 'images' : 'documents'}`);
    }

    // Generate unique filename
    const filename = this.generateFileName(file.originalname);
    
    // Determine media category
    const category = getMediaCategory(file.mimetype, categoryHint);
    
    // Generate S3 key with proper folder structure
    const s3Key = generateS3Key({
      workspaceId,
      clientId,
      brandId,
      category,
      filename,
      includeDatePath: !['avatar', 'banner', 'thumbnail', 'logo'].includes(categoryHint || ''),
    });

    // Upload to S3 with metadata
    const url = await uploadToS3(file.buffer, s3Key, file.mimetype, {
      'original-name': encodeURIComponent(file.originalname),
      'uploaded-by': userId,
      'workspace-id': workspaceId,
      ...(clientId && { 'client-id': clientId }),
      ...(brandId && { 'brand-id': brandId }),
    });

    // Determine media type for database
    const mediaType = this.getMediaType(file.mimetype);

    // Save to database
    const media = await prisma.mediaFile.create({
      data: {
        id: nanoid(),
        workspaceId,
        filename,
        originalName: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size,
        type: mediaType,
      },
    });

    return {
      ...media,
      s3Key,
      category,
    };
  }

  async uploadMultiple(files: UploadedFile[], options: UploadOptions) {
    const results = await Promise.all(
      files.map(file => this.upload(file, options))
    );
    return results;
  }

  // Upload specifically for images
  async uploadImage(file: UploadedFile, options: UploadOptions & { imageType?: 'photo' | 'graphic' | 'avatar' | 'banner' | 'thumbnail' }) {
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    return this.upload(file, { ...options, category: options.imageType });
  }

  // Upload specifically for videos
  async uploadVideo(file: UploadedFile, options: UploadOptions & { videoType?: 'post' | 'story' | 'reel' }) {
    if (!file.mimetype.startsWith('video/')) {
      throw new Error('File must be a video');
    }
    return this.upload(file, { ...options, category: options.videoType });
  }

  // Upload for a specific brand
  async uploadForBrand(file: UploadedFile, workspaceId: string, userId: string, brandId: string, categoryHint?: string) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { clientId: true },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    return this.upload(file, {
      workspaceId,
      userId,
      clientId: brand.clientId,
      brandId,
      category: categoryHint,
    });
  }

  // Upload for a specific client (shared folder)
  async uploadForClient(file: UploadedFile, workspaceId: string, userId: string, clientId: string, categoryHint?: string) {
    return this.upload(file, {
      workspaceId,
      userId,
      clientId,
      category: categoryHint,
    });
  }

  // Get all media for workspace
  async getByWorkspace(workspaceId: string, filters?: {
    type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    page?: number;
    limit?: number;
  }) {
    const { type, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };
    if (type) where.type = type;

    const [media, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get only images
  async getImages(workspaceId: string, page = 1, limit = 20) {
    return this.getByWorkspace(workspaceId, { type: 'IMAGE', page, limit });
  }

  // Get only videos
  async getVideos(workspaceId: string, page = 1, limit = 20) {
    return this.getByWorkspace(workspaceId, { type: 'VIDEO', page, limit });
  }

  // Get only documents
  async getDocuments(workspaceId: string, page = 1, limit = 20) {
    return this.getByWorkspace(workspaceId, { type: 'DOCUMENT', page, limit });
  }

  // Get media by client (from URL pattern)
  // This returns only client-level files, NOT brand files
  async getByClient(workspaceId: string, clientId: string, filters?: {
    type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    page?: number;
    limit?: number;
  }) {
    const { type, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const clientPattern = `clients/${clientId}`;
    const brandPattern = `/brands/`;
    
    // Fetch all files for the client, then filter out brand files
    // This is necessary because Prisma doesn't support "contains X but not contains Y" in a single query efficiently
    const where: any = {
      workspaceId,
      url: { contains: clientPattern },
    };
    if (type) where.type = type;

    const [allMedia, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mediaFile.count({ where }),
    ]);

    // Filter out files that are in brand folders
    const media = allMedia.filter(m => !m.url.includes(brandPattern));
    const filteredTotal = media.length;

    // Apply pagination after filtering
    const paginatedMedia = media.slice(skip, skip + limit);

    return {
      media: paginatedMedia,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    };
  }

  // Get media by brand
  async getByBrand(workspaceId: string, brandId: string, filters?: {
    type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    page?: number;
    limit?: number;
  }) {
    const { type, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const brandPattern = `brands/${brandId}`;
    
    const where: any = {
      workspaceId,
      url: { contains: brandPattern },
    };
    if (type) where.type = type;

    const [media, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    return prisma.mediaFile.findUnique({ where: { id } });
  }

  async delete(id: string, workspaceId: string) {
    const media = await prisma.mediaFile.findUnique({ where: { id } });
    
    if (!media || media.workspaceId !== workspaceId) {
      throw new Error('Media not found');
    }

    // Extract S3 key from URL and delete from S3
    const s3Key = extractS3KeyFromUrl(media.url);
    if (s3Key) {
      try {
        await deleteFromS3(s3Key);
      } catch (err) {
        console.error('Failed to delete from S3:', err);
      }
    }

    // Delete from database
    await prisma.mediaFile.delete({ where: { id } });

    return { success: true };
  }

  async getSignedUrl(key: string): Promise<string> {
    return getS3SignedUrl(key);
  }

  // Get storage limit based on plan
  private getStorageLimit(plan: string): number {
    const limits: Record<string, number> = {
      free: 5 * 1024 * 1024 * 1024,      // 5 GB
      starter: 20 * 1024 * 1024 * 1024,  // 20 GB
      professional: 100 * 1024 * 1024 * 1024, // 100 GB
      business: 500 * 1024 * 1024 * 1024, // 500 GB
      enterprise: -1, // Unlimited (-1 means no limit)
    };
    return limits[plan.toLowerCase()] || limits.free;
  }

  // Get detailed stats
  async getStats(workspaceId: string) {
    // Get workspace to check plan
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true },
    });

    const plan = workspace?.plan || 'free';
    const storageLimit = this.getStorageLimit(plan);

    const [
      total,
      images,
      videos,
      documents,
      sizeResult,
      recentImages,
      recentVideos,
    ] = await Promise.all([
      prisma.mediaFile.count({ where: { workspaceId } }),
      prisma.mediaFile.count({ where: { workspaceId, type: 'IMAGE' } }),
      prisma.mediaFile.count({ where: { workspaceId, type: 'VIDEO' } }),
      prisma.mediaFile.count({ where: { workspaceId, type: 'DOCUMENT' } }),
      prisma.mediaFile.aggregate({
        where: { workspaceId },
        _sum: { size: true },
      }),
      prisma.mediaFile.findMany({
        where: { workspaceId, type: 'IMAGE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, url: true, originalName: true },
      }),
      prisma.mediaFile.findMany({
        where: { workspaceId, type: 'VIDEO' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, url: true, originalName: true },
      }),
    ]);

    // Get size by type
    const [imageSize, videoSize, docSize] = await Promise.all([
      prisma.mediaFile.aggregate({
        where: { workspaceId, type: 'IMAGE' },
        _sum: { size: true },
      }),
      prisma.mediaFile.aggregate({
        where: { workspaceId, type: 'VIDEO' },
        _sum: { size: true },
      }),
      prisma.mediaFile.aggregate({
        where: { workspaceId, type: 'DOCUMENT' },
        _sum: { size: true },
      }),
    ]);

    const totalSize = sizeResult._sum.size || 0;

    return {
      total,
      images: {
        count: images,
        size: imageSize._sum.size || 0,
        recent: recentImages,
      },
      videos: {
        count: videos,
        size: videoSize._sum.size || 0,
        recent: recentVideos,
      },
      documents: {
        count: documents,
        size: docSize._sum.size || 0,
      },
      totalSize,
      storageLimit,
      plan,
      usagePercent: storageLimit > 0 ? Math.min(100, (totalSize / storageLimit) * 100) : 0,
    };
  }
}

export const mediaService = new MediaService();
