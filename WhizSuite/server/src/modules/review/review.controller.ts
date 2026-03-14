import { Response, NextFunction, Request } from 'express';
import { reviewService } from './review.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound, sendError } from '../../shared/utils/response.js';

export async function createLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const link = await reviewService.createLink(req.workspace!.id, req.user!.id, req.body);
    sendSuccess(res, link, 201);
  } catch (error) {
    next(error);
  }
}

export async function getLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const links = await reviewService.getLinks(req.workspace!.id);
    sendSuccess(res, links);
  } catch (error) {
    next(error);
  }
}

export async function getByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const link = await reviewService.getLinkByToken(req.params.token);
    if (!link) {
      return sendNotFound(res, 'Review link');
    }

    // Check password if set
    if (link.password) {
      const providedPassword = req.headers['x-review-password'] as string;
      if (providedPassword !== link.password) {
        return sendError(res, 'Password required', 401);
      }
    }

    sendSuccess(res, link);
  } catch (error) {
    next(error);
  }
}

export async function submitFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const link = await reviewService.getLinkByToken(req.params.token);
    if (!link) {
      return sendNotFound(res, 'Review link');
    }

    if (!link.allowApproval) {
      return sendError(res, 'Approval not allowed for this review', 403);
    }

    const feedback = await reviewService.submitFeedback(
      link.id,
      req.body.postId,
      req.body,
      {
        name: req.body.reviewerName,
        email: req.body.reviewerEmail,
      }
    );

    sendSuccess(res, feedback, 201);
  } catch (error: any) {
    if (error.message === 'Post not found in this review') {
      return sendNotFound(res, 'Post');
    }
    next(error);
  }
}

export async function deleteLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await reviewService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Review link');
    }
    await reviewService.deleteLink(req.params.id);
    sendSuccess(res, { message: 'Review link deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyLink(req: Request, res: Response, next: NextFunction) {
  try {
    const link = await reviewService.getLinkByToken(req.params.token);
    if (!link) {
      return sendNotFound(res, 'Review link');
    }

    // Check password if provided in body
    const { password } = req.body || {};
    if (link.password) {
      if (!password || password !== link.password) {
        return sendError(res, 'Invalid password', 401);
      }
    }

    sendSuccess(res, { valid: true, link });
  } catch (error) {
    next(error);
  }
}

export async function getPortalPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const link = await reviewService.getLinkByToken(req.params.token);
    if (!link) {
      return sendNotFound(res, 'Review link');
    }

    // Return posts for portal
    const posts = link.posts.map((rp: any) => rp.post);
    sendSuccess(res, posts);
  } catch (error) {
    next(error);
  }
}

export async function updateLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await reviewService.getById(req.params.id || req.params.linkId, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Review link');
    }
    const updated = await reviewService.updateLink(req.params.id || req.params.linkId, req.body);
    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

