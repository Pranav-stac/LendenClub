import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
    create,
    getAll,
    getById,
    update,
    remove,
    cancel,
    sendNow,
    bulkSend,
    retryFailed,
    getLogs,
    getStats,
    getChannelStatus,
    getMyNotifications,
    markAsRead,
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    notifyTeam,
    createReminder,
} from './notification.controller.js';
import {
    createNotificationSchema,
    updateNotificationSchema,
    createTemplateSchema,
    updateTemplateSchema,
    bulkSendSchema,
} from './notification.schema.js';

const router = Router();

router.use(authenticate);
router.use(loadWorkspace);

// =========================================================================
//  STATIC ROUTES (must come before /:id to avoid param matching)
// =========================================================================

// Stats & channel info
router.get('/stats', getStats);
router.get('/channels', getChannelStatus);

// In-app notifications for current user
router.get('/me/inbox', getMyNotifications);
router.patch('/me/read/:logId', markAsRead);

// Templates
router.post('/templates', validateBody(createTemplateSchema), createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', validateBody(updateTemplateSchema), updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// Bulk operations
router.post('/bulk-send', validateBody(bulkSendSchema), bulkSend);

// Convenience endpoints
router.post('/team-notify', notifyTeam);
router.post('/reminders', createReminder);

// =========================================================================
//  NOTIFICATIONS CRUD (param routes come last)
// =========================================================================

router.post('/', validateBody(createNotificationSchema), create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', validateBody(updateNotificationSchema), update);
router.patch('/:id', validateBody(updateNotificationSchema), update);
router.delete('/:id', remove);

// =========================================================================
//  NOTIFICATION ACTIONS
// =========================================================================

router.post('/:id/send', sendNow);
router.post('/:id/cancel', cancel);
router.post('/:id/retry', retryFailed);
router.get('/:id/logs', getLogs);

export { router as notificationRoutes };
