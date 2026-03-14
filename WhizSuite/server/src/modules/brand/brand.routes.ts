import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { create, getAll, getById, update, remove, grantAccess, revokeAccess } from './brand.controller.js';
import { createBrandSchema, updateBrandSchema } from './brand.schema.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

// All routes use x-workspace-id header
router.post('/', requirePermission('brands:create'), validateBody(createBrandSchema), create);
router.get('/', requirePermission('brands:view'), getAll);

// Member access management - MUST come before /:id
router.post('/:brandId/access/:memberId', requirePermission('brands:edit'), grantAccess);
router.delete('/:brandId/access/:memberId', requirePermission('brands:edit'), revokeAccess);

// Specific routes - MUST come before /:id
router.get('/:id/full', requirePermission('brands:view'), getById);
router.get('/:id', requirePermission('brands:view'), getById);
router.put('/:id', requirePermission('brands:edit'), validateBody(updateBrandSchema), update);
router.patch('/:id', requirePermission('brands:edit'), validateBody(updateBrandSchema), update);
router.delete('/:id', requirePermission('brands:delete'), remove);

export { router as brandRoutes };
