import { Response, NextFunction } from 'express';
import { postService } from './post.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound } from '../../shared/utils/response.js';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await postService.create(req.workspace!.id, req.user!.id, req.body);
    sendSuccess(res, post, 201);
  } catch (error) {
    next(error);
  }
}

export async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { brandId, status, startDate, endDate, search, page, limit } = req.query;
    const posts = await postService.getAll(req.workspace!.id, {
      brandId: brandId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    // Return posts (already has pagination structure if needed)
    sendSuccess(res, posts);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await postService.getById(req.params.id, req.workspace!.id);
    if (!post) {
      return sendNotFound(res, 'Post');
    }
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await postService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Post');
    }
    const post = await postService.update(req.params.id, req.body);
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await postService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Post');
    }
    // Determine status from route path
    let status = req.body.status;
    let scheduledAt: Date | undefined;

    if (req.path.includes('/submit')) {
      status = 'PENDING_APPROVAL';
    } else if (req.path.includes('/approve')) {
      status = 'APPROVED';
    } else if (req.path.includes('/schedule')) {
      status = 'SCHEDULED';
      // scheduledAt should be in the request body
      if (req.body.scheduledAt) {
        scheduledAt = new Date(req.body.scheduledAt);
      }
    } else if (req.path.includes('/publish')) {
      status = 'PUBLISHED';
      // Update post status first
      await postService.updateStatus(req.params.id, status, scheduledAt);

      // Then actually publish to Instagram
      try {
        await postService.publishToInstagram(req.params.id, req.workspace!.id);
      } catch (publishError: any) {
        // If publishing fails, the platform status will be set to FAILED
        // but we still return the post with PUBLISHED status
        console.error('Failed to publish to Instagram:', publishError.message);
      }

      // Get updated post with platform statuses
      const updatedPost = await postService.getById(req.params.id, req.workspace!.id);
      return sendSuccess(res, updatedPost);
    }
    const post = await postService.updateStatus(req.params.id, status, scheduledAt);
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await postService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Post');
    }
    await postService.delete(req.params.id);
    sendSuccess(res, { message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function bulkSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { postIds, scheduledAt } = req.body;
    await postService.bulkSchedule(postIds, new Date(scheduledAt));
    sendSuccess(res, { message: 'Posts scheduled successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await postService.getStats(req.workspace!.id);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

