import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound, sendError } from '../../shared/utils/response.js';

// =========================================================================
//  NOTIFICATIONS
// =========================================================================

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const notification = await notificationService.create(
            req.workspace!.id,
            req.user!.id,
            req.body
        );
        sendSuccess(res, notification, 201);
    } catch (error) {
        next(error);
    }
}

export async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {
            channel, category, status, priority,
            referenceType, referenceId, search,
            startDate, endDate, tags,
            page, limit,
        } = req.query;

        const result = await notificationService.getAll(req.workspace!.id, {
            channel: channel as string,
            category: category as string,
            status: status as string,
            priority: priority as string,
            referenceType: referenceType as string,
            referenceId: referenceId as string,
            search: search as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            tags: tags ? (tags as string).split(',') : undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const notification = await notificationService.getById(req.params.id, req.workspace!.id);
        if (!notification) return sendNotFound(res, 'Notification');
        sendSuccess(res, notification);
    } catch (error) {
        next(error);
    }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const notification = await notificationService.update(
            req.params.id,
            req.workspace!.id,
            req.body
        );
        sendSuccess(res, notification);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        if (error.message?.includes('Only DRAFT')) return sendError(res, error.message);
        next(error);
    }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        await notificationService.delete(req.params.id, req.workspace!.id);
        sendSuccess(res, { message: 'Notification deleted successfully' });
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        next(error);
    }
}

export async function cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const notification = await notificationService.cancel(req.params.id, req.workspace!.id);
        sendSuccess(res, notification);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        if (error.message?.includes('cannot be cancelled')) return sendError(res, error.message);
        next(error);
    }
}

export async function sendNow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const result = await notificationService.sendNow(req.params.id, req.workspace!.id);
        sendSuccess(res, result);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        if (error.message?.includes('already been sent')) return sendError(res, error.message);
        next(error);
    }
}

export async function bulkSend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { notificationIds } = req.body;
        const results = await notificationService.bulkSend(notificationIds, req.workspace!.id);
        sendSuccess(res, results);
    } catch (error) {
        next(error);
    }
}

export async function retryFailed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const result = await notificationService.retryFailed(req.params.id, req.workspace!.id);
        sendSuccess(res, result);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        if (error.message?.includes('Only failed')) return sendError(res, error.message);
        next(error);
    }
}

export async function getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const logs = await notificationService.getLogs(req.params.id, req.workspace!.id);
        sendSuccess(res, logs);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Notification');
        next(error);
    }
}

export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const stats = await notificationService.getStats(req.workspace!.id);
        sendSuccess(res, stats);
    } catch (error) {
        next(error);
    }
}

export async function getChannelStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const status = notificationService.getChannelStatus();
        sendSuccess(res, status);
    } catch (error) {
        next(error);
    }
}

// =========================================================================
//  IN-APP NOTIFICATIONS (user-facing)
// =========================================================================

export async function getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { unreadOnly, page, limit } = req.query;
        const result = await notificationService.getUserInAppNotifications(
            req.user!.id,
            req.workspace!.id,
            {
                unreadOnly: unreadOnly === 'true',
                page: page ? parseInt(page as string, 10) : undefined,
                limit: limit ? parseInt(limit as string, 10) : undefined,
            }
        );
        sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const log = await notificationService.markAsRead(req.params.logId);
        sendSuccess(res, log);
    } catch (error) {
        next(error);
    }
}

// =========================================================================
//  TEMPLATES
// =========================================================================

export async function createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const template = await notificationService.createTemplate(req.workspace!.id, req.body);
        sendSuccess(res, template, 201);
    } catch (error) {
        next(error);
    }
}

export async function getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { channel, category, search } = req.query;
        const templates = await notificationService.getTemplates(req.workspace!.id, {
            channel: channel as string,
            category: category as string,
            search: search as string,
        });
        sendSuccess(res, templates);
    } catch (error) {
        next(error);
    }
}

export async function getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const template = await notificationService.getTemplateById(req.params.id);
        if (!template) return sendNotFound(res, 'Template');
        sendSuccess(res, template);
    } catch (error) {
        next(error);
    }
}

export async function updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const template = await notificationService.updateTemplate(req.params.id, req.body);
        sendSuccess(res, template);
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Template');
        if (error.message?.includes('System templates')) return sendError(res, error.message, 403);
        next(error);
    }
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        await notificationService.deleteTemplate(req.params.id);
        sendSuccess(res, { message: 'Template deleted successfully' });
    } catch (error: any) {
        if (error.message?.includes('not found')) return sendNotFound(res, 'Template');
        if (error.message?.includes('System templates')) return sendError(res, error.message, 403);
        next(error);
    }
}

// =========================================================================
//  CONVENIENCE ENDPOINTS
// =========================================================================

export async function notifyTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const result = await notificationService.notifyTeam(
            req.workspace!.id,
            req.user!.id,
            req.body
        );
        sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
}

export async function createReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const reminder = await notificationService.createReminder(
            req.workspace!.id,
            req.user!.id,
            req.body
        );
        sendSuccess(res, reminder, 201);
    } catch (error) {
        next(error);
    }
}
