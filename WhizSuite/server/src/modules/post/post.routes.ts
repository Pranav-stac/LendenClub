import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  create,
  getAll,
  getById,
  update,
  updateStatus,
  remove,
  bulkSchedule,
  getStats,
} from './post.controller.js';
import { createPostSchema, updatePostSchema, bulkScheduleSchema } from './post.schema.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

// All routes use x-workspace-id header
router.post('/', requirePermission('posts:create'), validateBody(createPostSchema), create);
router.get('/', requirePermission('posts:view'), getAll);
router.get('/stats', requirePermission('posts:view'), getStats);
router.get('/:id', requirePermission('posts:view'), getById);
router.put('/:id', requirePermission('posts:edit'), validateBody(updatePostSchema), update);
router.patch('/:id', requirePermission('posts:edit'), validateBody(updatePostSchema), update);
router.delete('/:id', requirePermission('posts:delete'), remove);

// Status updates
router.post('/:id/submit', requirePermission('posts:edit'), updateStatus);
router.post('/:id/approve', requirePermission('reviews:approve'), updateStatus);
router.post('/:id/schedule', requirePermission('posts:schedule'), updateStatus);
router.post('/:id/publish', requirePermission('posts:schedule'), updateStatus);
router.patch('/:id/status', requirePermission('posts:edit'), updateStatus);

// Bulk operations
router.post('/bulk-schedule', requirePermission('posts:schedule'), validateBody(bulkScheduleSchema), bulkSchedule);

export { router as postRoutes };
