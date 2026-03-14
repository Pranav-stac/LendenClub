import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace } from '../../shared/middleware/workspace.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

router.get('/stats', dashboardController.getStats);

export { router as dashboardRoutes };
