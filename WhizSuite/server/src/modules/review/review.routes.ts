import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createLink, getLinks, getByToken, submitFeedback, deleteLink, verifyLink, getPortalPosts, updateLink } from './review.controller.js';
import { createReviewLinkSchema, submitFeedbackSchema } from './review.schema.js';

const router = Router();

// Public routes (for clients viewing reviews)
router.get('/public/:token', getByToken);
router.post('/public/:token/feedback', validateBody(submitFeedbackSchema), submitFeedback);
router.post('/verify/:token', validateBody(z.object({ password: z.string().optional() })), verifyLink);
router.get('/portal/:token/posts', getPortalPosts);

// Protected routes - use x-workspace-id header
router.use(authenticate);
router.use(loadWorkspace);

router.post('/', requirePermission('reviews:create'), validateBody(createReviewLinkSchema), createLink);
router.get('/', requirePermission('reviews:view'), getLinks);
router.get('/:id', requirePermission('reviews:view'), getByToken);
router.put('/:id', requirePermission('reviews:edit'), updateLink);
router.delete('/:id', requirePermission('reviews:delete'), deleteLink);

export { router as reviewRoutes };
