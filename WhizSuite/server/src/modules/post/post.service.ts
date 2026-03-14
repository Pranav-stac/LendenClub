import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import type { CreatePostInput, UpdatePostInput } from './post.schema.js';
import { InstagramAPI } from '../platform/integrations/instagram/instagram.api.js';

export class PostService {
  async create(workspaceId: string, userId: string, data: CreatePostInput) {
    const { platformIds, mediaIds, ...postData } = data;

    // Handle mediaIds - if provided, fetch media URLs from MediaFile table
    let mediaUrls = postData.mediaUrls || [];
    if (mediaIds && mediaIds.length > 0) {
      const mediaFiles = await prisma.mediaFile.findMany({
        where: { id: { in: mediaIds }, workspaceId },
        select: { url: true },
      });
      mediaUrls = [...mediaUrls, ...mediaFiles.map((m) => m.url)];
    }

    // Auto-detect carousel if multiple media items and postType is 'post'
    const postType = postData.postType || 'post';
    const effectivePostType = (postType === 'post' && mediaUrls.length > 1) ? 'carousel' : postType;

    const createData: any = {
      id: nanoid(),
      workspaceId,
      createdById: userId,
      ...postData,
      postType: effectivePostType,
      mediaUrls,
      status: postData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      platforms: {
        create: platformIds.map((platformId: string) => ({
          platformId,
        })),
      },
    };

    const post = await prisma.post.create({
      data: createData,
      include: {
        brand: {
          select: { id: true, name: true },
        },
        platforms: {
          include: {
            platform: true,
          } as any,
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return post;
  }

  async getAll(workspaceId: string, filters?: {
    brandId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { workspaceId: workspaceId as any };

    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) where.scheduledAt.gte = filters.startDate;
      if (filters.endDate) where.scheduledAt.lte = filters.endDate;
    }
    if (filters?.search) {
      where.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { hashtags: { has: filters.search } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          brand: {
            select: { id: true, name: true },
          },
          platforms: {
            include: {
              platform: true,
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, workspaceId: string) {
    return prisma.post.findFirst({
      where: { id, workspaceId: workspaceId as any },
      include: {
        brand: true,
        platforms: {
          include: {
            platform: true,
          } as any,
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: UpdatePostInput) {
    const { platformIds, ...updateData } = data;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        ...(platformIds && {
          platforms: {
            deleteMany: {},
            create: platformIds.map((platformId) => ({
              platformId,
            })),
          },
        }),
      },
      include: {
        brand: {
          select: { id: true, name: true },
        },
        platforms: {
          include: {
            platform: true,
          } as any,
        },
      },
    });

    return post;
  }

  async updateStatus(id: string, status: string, scheduledAt?: Date) {
    return prisma.post.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'PUBLISHED' && { publishedAt: new Date() }),
        ...(status === 'APPROVED' && { approvedAt: new Date() }), // Set approvedAt when approved
        ...(scheduledAt && { scheduledAt }), // Update scheduledAt if provided
      },
      include: {
        brand: {
          select: { id: true, name: true },
        },
        platforms: {
          include: {
            platform: true,
          } as any,
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.post.delete({ where: { id } });
  }

  async bulkSchedule(postIds: string[], scheduledAt: Date) {
    return prisma.post.updateMany({
      where: { id: { in: postIds } },
      data: {
        scheduledAt,
        status: 'SCHEDULED',
      },
    });
  }

  async getScheduledPosts(before: Date) {
    return prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: before },
      },
      include: {
        brand: true,
        platforms: {
          include: {
            platform: true,
          } as any,
        },
      },
    });
  }

  async publishToInstagram(postId: string, workspaceId: string) {
    // Get the post with all details
    const post = await this.getById(postId, workspaceId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Find Instagram platform
    const instagramPlatform = post.platforms.find(
      (p: any) => p.platform.name.toLowerCase() === 'instagram'
    );

    if (!instagramPlatform) {
      throw new Error('Instagram platform not configured for this post');
    }

    // Get the platform connection with access token
    const connection = await prisma.platformConnection.findFirst({
      where: {
        brandId: post.brandId,
        platformId: instagramPlatform.platformId,
        isActive: true,
      },
      include: {
        brand: true,
      },
    });

    if (!connection) {
      throw new Error('No active Instagram connection found');
    }

    // Instagram requires media
    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      // Update platform status to failed
      await prisma.postPlatform.update({
        where: { id: instagramPlatform.id },
        data: {
          status: 'FAILED',
          error: 'Instagram requires at least one media file',
        },
      });
      throw new Error('Instagram requires at least one media file');
    }

    // Get Instagram Business Account ID from connection metadata
    const metadata = connection.metadata as any;
    const instagramAccountId = metadata?.instagram_business_account_id || connection.platformUserId;

    if (!instagramAccountId) {
      await prisma.postPlatform.update({
        where: { id: instagramPlatform.id },
        data: {
          status: 'FAILED',
          error: 'Instagram Business Account ID not found in connection',
        },
      });
      throw new Error('Instagram Business Account ID not found in connection');
    }

    try {
      // Publish to Instagram with post type support
      const instagramAPI = new InstagramAPI();
      const postRecord = post as any;
      const result = await instagramAPI.publishPost(
        connection.accessToken,
        {
          content: post.content,
          postType: postRecord.postType || 'post',
          mediaUrls: post.mediaUrls,
          hashtags: post.hashtags,
          mentions: post.mentions,
          coverUrl: postRecord.coverUrl || undefined,
          altText: postRecord.altText || undefined,
          shareToFeed: postRecord.shareToFeed !== false,
          trialGraduationStrategy: postRecord.trialGraduationStrategy || undefined,
          audioName: postRecord.audioName || undefined,
          userTags: postRecord.userTags || undefined,
          locationId: postRecord.locationId || undefined,
          collaborators: postRecord.collaborators?.length ? postRecord.collaborators : undefined,
          thumbOffset: typeof postRecord.thumbOffset === 'number' ? postRecord.thumbOffset : undefined,
        },
        {
          apiVersion: 'v21.0',
          instagramAccountId, // Pass the account ID directly
        }
      );

      // Update platform post with success
      await prisma.postPlatform.update({
        where: { id: instagramPlatform.id },
        data: {
          status: 'PUBLISHED',
          platformPostId: result.platformPostId,
          publishedAt: result.publishedAt,
          error: null,
        },
      });

      return result;
    } catch (error: any) {
      // Update platform post with failure
      await prisma.postPlatform.update({
        where: { id: instagramPlatform.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Failed to publish to Instagram',
        },
      });

      throw error;
    }
  }

  async getStats(workspaceId: string) {
    const [total, draft, scheduled, published, failed] = await Promise.all([
      prisma.post.count({ where: { workspaceId: workspaceId as any } }),
      prisma.post.count({ where: { workspaceId: workspaceId as any, status: 'DRAFT' as any } }),
      prisma.post.count({ where: { workspaceId: workspaceId as any, status: 'SCHEDULED' as any } }),
      prisma.post.count({ where: { workspaceId: workspaceId as any, status: 'PUBLISHED' as any } }),
      prisma.post.count({ where: { workspaceId: workspaceId as any, status: 'FAILED' as any } }),
    ]);

    return { total, draft, scheduled, published, failed };
  }
}

export const postService = new PostService();

