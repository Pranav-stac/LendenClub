import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { create, getEvents, getById, update, remove } from './calendar.controller.js';
import { createEventSchema, updateEventSchema } from './calendar.schema.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

// All routes use x-workspace-id header
router.post('/', requirePermission('calendar:create'), validateBody(createEventSchema), create);
router.get('/', requirePermission('calendar:view'), getEvents);
router.get('/:id', requirePermission('calendar:view'), getById);
router.put('/:id', requirePermission('calendar:edit'), validateBody(updateEventSchema), update);
router.patch('/:id', requirePermission('calendar:edit'), validateBody(updateEventSchema), update);
router.delete('/:id', requirePermission('calendar:delete'), remove);

export { router as calendarRoutes };
