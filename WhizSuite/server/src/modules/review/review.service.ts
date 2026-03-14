import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import type { CreateReviewLinkInput, SubmitFeedbackInput } from './review.schema.js';

export class ReviewService {
  async createLink(workspaceId: string, userId: string, data: CreateReviewLinkInput) {
    const token = nanoid(32);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    return prisma.reviewLink.create({
      data: {
        id: nanoid(),
        workspaceId,
        createdById: userId,
        name: data.name,
        token,
        expiresAt,
        allowComments: data.allowComments,
        allowApproval: data.allowApproval,
        password: data.password,
        posts: {
          create: (data.postIds || []).map((postId) => ({
            id: nanoid(),
            postId,
          })),
        },
      },
      include: {
        posts: {
          include: {
            post: {
              include: {
                brand: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async getLinks(workspaceId: string) {
    return prisma.reviewLink.findMany({
      where: { workspaceId },
      include: {
        posts: {
          include: {
            post: {
              select: { id: true, content: true, status: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLinkByToken(token: string) {
    const link = await prisma.reviewLink.findUnique({
      where: { token },
      include: {
        posts: {
          include: {
            post: {
              include: {
                brand: true,
                platforms: {
                  include: { platform: true },
                },
              },
            },
            feedback: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        workspace: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    if (!link) return null;
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;

    // Update view count
    await prisma.reviewLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });

    return link;
  }

  async submitFeedback(reviewLinkId: string, postId: string, data: SubmitFeedbackInput, reviewerInfo?: {
    name?: string;
    email?: string;
  }) {
    const reviewPost = await prisma.reviewPost.findFirst({
      where: { reviewLinkId, postId },
    });

    if (!reviewPost) throw new Error('Post not found in this review');

    const feedback = await prisma.reviewFeedback.create({
      data: {
        id: nanoid(),
        reviewPostId: reviewPost.id,
        status: data.status,
        comment: data.comment,
        reviewerName: reviewerInfo?.name,
        reviewerEmail: reviewerInfo?.email,
      },
    });

    // Update post status based on feedback
    if (data.status === 'APPROVED') {
      await prisma.post.update({
        where: { id: postId },
        data: { 
          approvedAt: new Date(),
          status: 'APPROVED',
        },
      });
    } else if (data.status === 'REJECTED' || data.status === 'NEEDS_CHANGES') {
      await prisma.post.update({
        where: { id: postId },
        data: { 
          status: 'DRAFT', // Revert to draft for changes
        },
      });
    }

    return feedback;
  }

  async deleteLink(id: string) {
    return prisma.reviewLink.delete({ where: { id } });
  }

  async getById(id: string, workspaceId: string) {
    return prisma.reviewLink.findFirst({
      where: { id, workspaceId },
      include: {
        posts: {
          include: {
            post: true,
            feedback: true,
          },
        },
      },
    });
  }

  async updateLink(id: string, data: {
    name?: string;
    expiresAt?: string | null;
    isActive?: boolean;
    allowComments?: boolean;
    allowApproval?: boolean;
    password?: string | null;
  }) {
    return prisma.reviewLink.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.allowComments !== undefined && { allowComments: data.allowComments }),
        ...(data.allowApproval !== undefined && { allowApproval: data.allowApproval }),
        ...(data.password !== undefined && { password: data.password }),
      },
      include: {
        posts: {
          include: {
            post: true,
            feedback: true,
          },
        },
      },
    });
  }
}

export const reviewService = new ReviewService();

