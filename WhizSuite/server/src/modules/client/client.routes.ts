import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { create, getAll, getById, update, remove, grantAccess, revokeAccess } from './client.controller.js';
import { createClientSchema, updateClientSchema } from './client.schema.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

// All routes use x-workspace-id header
router.post('/', requirePermission('clients:create'), validateBody(createClientSchema), create);
router.get('/', requirePermission('clients:view'), getAll);

// Member access management - MUST come before /:id
router.post('/:clientId/access/:memberId', requirePermission('clients:edit'), grantAccess);
router.delete('/:clientId/access/:memberId', requirePermission('clients:edit'), revokeAccess);

// Specific routes - MUST come before /:id
router.get('/:id/full', requirePermission('clients:view'), getById);
router.get('/:id', requirePermission('clients:view'), getById);
router.put('/:id', requirePermission('clients:edit'), validateBody(updateClientSchema), update);
router.patch('/:id', requirePermission('clients:edit'), validateBody(updateClientSchema), update);
router.delete('/:id', requirePermission('clients:delete'), remove);

export { router as clientRoutes };
