import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import { channelRegistry } from './channels/index.js';
import type { SendPayload } from './channels/index.js';
import type {
    CreateNotificationInput,
    UpdateNotificationInput,
    CreateTemplateInput,
    UpdateTemplateInput,
    Recipient,
} from './notification.schema.js';

export class NotificationService {

    // =========================================================================
    //  NOTIFICATIONS - CRUD
    // =========================================================================

    /**
     * Create a notification (draft or scheduled).
     * If sendNow is true, it will be dispatched immediately after creation.
     */
    async create(workspaceId: string, userId: string, data: CreateNotificationInput) {
        const {
            sendNow,
            templateId,
            templateData,
            scheduledAt,
            recurrenceEnd,
            ...rest
        } = data;

        // If using a template, merge template content
        let resolvedBody = rest.body;
        let resolvedRichBody = rest.richBody;
        let resolvedTitle = rest.title;

        if (templateId) {
            const template = await this.getTemplateById(templateId);
            if (template) {
                resolvedBody = this.renderTemplate(template.body, templateData || {});
                resolvedRichBody = template.richBody
                    ? this.renderTemplate(template.richBody, templateData || {})
                    : resolvedRichBody;
                resolvedTitle = template.subject
                    ? this.renderTemplate(template.subject, templateData || {})
                    : resolvedTitle;
            }
        }

        // Determine initial status
        let status = 'DRAFT';
        if (sendNow) status = 'SENDING';
        else if (scheduledAt) status = 'SCHEDULED';

        const notification = await prisma.notification.create({
            data: {
                id: nanoid(),
                workspaceId,
                createdById: userId,
                title: resolvedTitle,
                body: resolvedBody,
                richBody: resolvedRichBody,
                channel: rest.channel,
                recipients: rest.recipients as any,
                category: rest.category || 'GENERAL',
                priority: rest.priority || 'NORMAL',
                status,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                isRecurring: rest.isRecurring || false,
                recurrenceRule: rest.recurrenceRule,
                recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
                nextTriggerAt: scheduledAt ? new Date(scheduledAt) : null,
                templateId: templateId ?? undefined,
                templateData: (templateData != null ? templateData : Prisma.JsonNull) as Prisma.InputJsonValue,
                referenceType: rest.referenceType,
                referenceId: rest.referenceId,
                metadata: (rest.metadata != null ? rest.metadata : Prisma.JsonNull) as Prisma.InputJsonValue,
                tags: rest.tags || [],
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                template: true,
                logs: true,
            },
        });

        // If sendNow, dispatch immediately
        if (sendNow) {
            await this.dispatch(notification.id);
            // Refetch with updated status
            return this.getById(notification.id, workspaceId);
        }

        return notification;
    }

    /**
     * Get all notifications with filters and pagination.
     */
    async getAll(workspaceId: string, filters: {
        channel?: string;
        category?: string;
        status?: string;
        priority?: string;
        referenceType?: string;
        referenceId?: string;
        search?: string;
        startDate?: Date;
        endDate?: Date;
        tags?: string[];
        page?: number;
        limit?: number;
    } = {}) {
        const where: any = { workspaceId };

        if (filters.channel) where.channel = filters.channel;
        if (filters.category) where.category = filters.category;
        if (filters.status) where.status = filters.status;
        if (filters.priority) where.priority = filters.priority;
        if (filters.referenceType) where.referenceType = filters.referenceType;
        if (filters.referenceId) where.referenceId = filters.referenceId;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { body: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.tags && filters.tags.length > 0) {
            where.tags = { hasSome: filters.tags };
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                include: {
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
                    template: { select: { id: true, name: true, slug: true } },
                    _count: { select: { logs: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
        ]);

        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single notification by ID.
     */
    async getById(id: string, workspaceId: string) {
        return prisma.notification.findFirst({
            where: { id, workspaceId },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                template: true,
                logs: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    /**
     * Update a notification (only DRAFT or SCHEDULED ones).
     */
    async update(id: string, workspaceId: string, data: UpdateNotificationInput) {
        const existing = await this.getById(id, workspaceId);
        if (!existing) throw new Error('Notification not found');
        if (!['DRAFT', 'SCHEDULED'].includes(existing.status)) {
            throw new Error('Only DRAFT or SCHEDULED notifications can be updated');
        }

        const { scheduledAt, recurrenceEnd, templateId, templateData, ...rest } = data;

        const updateData: Record<string, unknown> = {
            ...rest,
            ...(scheduledAt !== undefined && {
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
                nextTriggerAt: scheduledAt ? new Date(scheduledAt) : null,
            }),
            ...(recurrenceEnd !== undefined && {
                recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
            }),
            recipients: rest.recipients as any,
        };
        if (templateId !== undefined) updateData.templateId = templateId ?? null;
        if (templateData !== undefined) updateData.templateData = templateData != null ? templateData : Prisma.JsonNull;

        return prisma.notification.update({
            where: { id },
            data: updateData as any,
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                template: true,
                logs: true,
            },
        });
    }

    /**
     * Delete a notification.
     */
    async delete(id: string, workspaceId: string) {
        const existing = await this.getById(id, workspaceId);
        if (!existing) throw new Error('Notification not found');
        return prisma.notification.delete({ where: { id } });
    }

    /**
     * Cancel a scheduled notification.
     */
    async cancel(id: string, workspaceId: string) {
        const existing = await this.getById(id, workspaceId);
        if (!existing) throw new Error('Notification not found');
        if (!['DRAFT', 'SCHEDULED', 'SENDING'].includes(existing.status)) {
            throw new Error('This notification cannot be cancelled');
        }

        return prisma.notification.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                template: true,
                logs: true,
            },
        });
    }

    // =========================================================================
    //  DISPATCH & SENDING
    // =========================================================================

    /**
     * Dispatch a notification — sends it to all recipients via the configured channel.
     */
    async dispatch(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            include: { template: true },
        });

        if (!notification) throw new Error('Notification not found');

        const provider = channelRegistry.getProvider(notification.channel);
        if (!provider) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { status: 'FAILED' },
            });
            throw new Error(`No provider registered for channel: ${notification.channel}`);
        }

        if (!provider.isConfigured()) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { status: 'FAILED' },
            });
            throw new Error(`Channel ${notification.channel} is not configured`);
        }

        // Mark as sending
        await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENDING' },
        });

        const recipients = notification.recipients as unknown as Recipient[];
        let successCount = 0;
        let failCount = 0;

        for (const recipient of recipients) {
            const payload: SendPayload = {
                to: recipient.value,
                toName: recipient.name,
                subject: notification.title,
                body: notification.body,
                richBody: notification.richBody || undefined,
                priority: notification.priority,
                metadata: notification.metadata as any,
            };

            // Add WhatsApp-specific fields
            if (notification.channel === 'WHATSAPP' && notification.template) {
                payload.whatsappTemplateName = notification.template.whatsappTemplateName || undefined;
                payload.whatsappLanguage = notification.template.whatsappLanguage || undefined;
                payload.whatsappTemplateData = notification.templateData as any;
            }

            const result = await provider.send(payload);

            // Create delivery log
            await prisma.notificationLog.create({
                data: {
                    notificationId,
                    recipientType: recipient.type,
                    recipientValue: recipient.value,
                    recipientName: recipient.name,
                    channel: notification.channel,
                    status: result.success ? 'SENT' : 'FAILED',
                    providerName: result.providerName,
                    providerMessageId: result.providerMessageId,
                    error: result.error,
                    sentAt: result.success ? new Date() : null,
                    failedAt: result.success ? null : new Date(),
                },
            });

            if (result.success) successCount++;
            else failCount++;
        }

        // Update notification status
        let finalStatus = 'SENT';
        if (failCount === recipients.length) finalStatus = 'FAILED';
        else if (failCount > 0) finalStatus = 'PARTIALLY_SENT';

        await prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: finalStatus,
                sentAt: successCount > 0 ? new Date() : null,
                lastTriggeredAt: new Date(),
            },
        });

        return { successCount, failCount, total: recipients.length, status: finalStatus };
    }

    /**
     * Send an existing draft/scheduled notification immediately.
     */
    async sendNow(id: string, workspaceId: string) {
        const notification = await this.getById(id, workspaceId);
        if (!notification) throw new Error('Notification not found');
        if (['SENT', 'SENDING', 'PARTIALLY_SENT'].includes(notification.status)) {
            throw new Error('Notification has already been sent');
        }

        return this.dispatch(id);
    }

    /**
     * Bulk send multiple notifications.
     */
    async bulkSend(notificationIds: string[], workspaceId: string) {
        const results: Array<{ id: string; result: any; error?: string }> = [];

        for (const id of notificationIds) {
            try {
                const result = await this.sendNow(id, workspaceId);
                results.push({ id, result });
            } catch (error: any) {
                results.push({ id, result: null, error: error.message });
            }
        }

        return results;
    }

    /**
     * Retry failed notifications.
     */
    async retryFailed(notificationId: string, workspaceId: string) {
        const notification = await this.getById(notificationId, workspaceId);
        if (!notification) throw new Error('Notification not found');
        if (!['FAILED', 'PARTIALLY_SENT'].includes(notification.status)) {
            throw new Error('Only failed notifications can be retried');
        }

        // Reset status and re-dispatch
        await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'DRAFT' },
        });

        // Delete old failed logs (keep successful ones)
        await prisma.notificationLog.deleteMany({
            where: {
                notificationId,
                status: { in: ['FAILED', 'BOUNCED'] },
            },
        });

        return this.dispatch(notificationId);
    }

    // =========================================================================
    //  SCHEDULED NOTIFICATIONS PROCESSOR
    // =========================================================================

    /**
     * Process due scheduled notifications.
     * Call this from a cron job (e.g., every minute).
     */
    async processScheduled() {
        const now = new Date();

        const dueNotifications = await prisma.notification.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: now },
            },
            take: 50, // Process in batches
        });

        const results: Array<{ id: string; status: string; error?: string }> = [];

        for (const notification of dueNotifications) {
            try {
                const result = await this.dispatch(notification.id);
                results.push({ id: notification.id, status: result.status });

                // Handle recurring notifications
                if (notification.isRecurring && notification.recurrenceRule) {
                    await this.scheduleNextRecurrence(notification);
                }
            } catch (error: any) {
                results.push({ id: notification.id, status: 'FAILED', error: error.message });
            }
        }

        return { processed: results.length, results };
    }

    /**
     * Schedule the next occurrence of a recurring notification.
     */
    private async scheduleNextRecurrence(notification: any) {
        const nextTrigger = this.calculateNextTrigger(
            notification.recurrenceRule,
            notification.scheduledAt,
            notification.recurrenceEnd
        );

        if (!nextTrigger) return; // Recurrence has ended

        // Create a new notification for the next occurrence
        await prisma.notification.create({
            data: {
                id: nanoid(),
                workspaceId: notification.workspaceId,
                createdById: notification.createdById,
                title: notification.title,
                body: notification.body,
                richBody: notification.richBody,
                channel: notification.channel,
                recipients: notification.recipients,
                category: notification.category,
                priority: notification.priority,
                status: 'SCHEDULED',
                scheduledAt: nextTrigger,
                isRecurring: true,
                recurrenceRule: notification.recurrenceRule,
                recurrenceEnd: notification.recurrenceEnd,
                nextTriggerAt: nextTrigger,
                templateId: notification.templateId,
                templateData: notification.templateData,
                referenceType: notification.referenceType,
                referenceId: notification.referenceId,
                metadata: notification.metadata,
                tags: notification.tags,
            },
        });
    }

    /**
     * Simple RRULE parser for calculating next trigger time.
     * Supports: FREQ=DAILY|WEEKLY|MONTHLY, INTERVAL=n, COUNT=n
     */
    private calculateNextTrigger(
        rrule: string,
        lastTrigger: Date,
        recurrenceEnd: Date | null
    ): Date | null {
        const parts = rrule.split(';').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const freq = parts['FREQ'] || 'DAILY';
        const interval = parseInt(parts['INTERVAL'] || '1', 10);

        const next = new Date(lastTrigger);

        switch (freq) {
            case 'MINUTELY':
                next.setMinutes(next.getMinutes() + interval);
                break;
            case 'HOURLY':
                next.setHours(next.getHours() + interval);
                break;
            case 'DAILY':
                next.setDate(next.getDate() + interval);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + 7 * interval);
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + interval);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + interval);
                break;
        }

        // Check if we've exceeded the recurrence end
        if (recurrenceEnd && next > recurrenceEnd) {
            return null;
        }

        return next;
    }

    // =========================================================================
    //  TEMPLATES
    // =========================================================================

    async createTemplate(workspaceId: string | null, data: CreateTemplateInput) {
        return prisma.notificationTemplate.create({
            data: {
                id: nanoid(),
                workspaceId,
                ...data,
            },
        });
    }

    async getTemplates(workspaceId: string, filters?: { channel?: string; category?: string; search?: string }) {
        const where: any = {
            OR: [
                { workspaceId },
                { workspaceId: null }, // System templates
            ],
            isActive: true,
        };

        if (filters?.channel) where.channel = filters.channel;
        if (filters?.category) where.category = filters.category;
        if (filters?.search) {
            where.AND = [
                {
                    OR: [
                        { name: { contains: filters.search, mode: 'insensitive' } },
                        { description: { contains: filters.search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        return prisma.notificationTemplate.findMany({
            where,
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        });
    }

    async getTemplateById(id: string) {
        return prisma.notificationTemplate.findUnique({ where: { id } });
    }

    async getTemplateBySlug(slug: string) {
        return prisma.notificationTemplate.findUnique({ where: { slug } });
    }

    async updateTemplate(id: string, data: UpdateTemplateInput) {
        const existing = await this.getTemplateById(id);
        if (!existing) throw new Error('Template not found');
        if (existing.isSystem) throw new Error('System templates cannot be modified');

        return prisma.notificationTemplate.update({
            where: { id },
            data,
        });
    }

    async deleteTemplate(id: string) {
        const existing = await this.getTemplateById(id);
        if (!existing) throw new Error('Template not found');
        if (existing.isSystem) throw new Error('System templates cannot be deleted');

        return prisma.notificationTemplate.delete({ where: { id } });
    }

    // =========================================================================
    //  DELIVERY LOGS
    // =========================================================================

    async getLogs(notificationId: string, workspaceId: string) {
        // Verify notification belongs to workspace
        const notification = await this.getById(notificationId, workspaceId);
        if (!notification) throw new Error('Notification not found');

        return prisma.notificationLog.findMany({
            where: { notificationId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getLogStats(workspaceId: string) {
        const [total, sent, delivered, failed, pending] = await Promise.all([
            prisma.notificationLog.count({
                where: { notification: { workspaceId } },
            }),
            prisma.notificationLog.count({
                where: { notification: { workspaceId }, status: 'SENT' },
            }),
            prisma.notificationLog.count({
                where: { notification: { workspaceId }, status: 'DELIVERED' },
            }),
            prisma.notificationLog.count({
                where: { notification: { workspaceId }, status: 'FAILED' },
            }),
            prisma.notificationLog.count({
                where: { notification: { workspaceId }, status: 'PENDING' },
            }),
        ]);

        return { total, sent, delivered, failed, pending };
    }

    /**
     * Mark an in-app notification as read (by the recipient).
     */
    async markAsRead(logId: string) {
        return prisma.notificationLog.update({
            where: { id: logId },
            data: {
                status: 'READ',
                readAt: new Date(),
            },
        });
    }

    /**
     * Get in-app notifications for a specific user.
     */
    async getUserInAppNotifications(userId: string, workspaceId: string, filters?: {
        unreadOnly?: boolean;
        page?: number;
        limit?: number;
    }) {
        const where: any = {
            channel: 'IN_APP',
            recipientType: 'user',
            recipientValue: userId,
            notification: { workspaceId },
        };

        if (filters?.unreadOnly) {
            where.status = { not: 'READ' };
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const [logs, total, unreadCount] = await Promise.all([
            prisma.notificationLog.findMany({
                where,
                include: {
                    notification: {
                        select: {
                            id: true,
                            title: true,
                            body: true,
                            category: true,
                            priority: true,
                            referenceType: true,
                            referenceId: true,
                            metadata: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notificationLog.count({ where }),
            prisma.notificationLog.count({
                where: { ...where, status: { not: 'READ' } },
            }),
        ]);

        return {
            data: logs,
            unreadCount,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    // =========================================================================
    //  STATS
    // =========================================================================

    async getStats(workspaceId: string) {
        const [
            totalNotifications,
            draft,
            scheduled,
            sent,
            failed,
            byChannel,
            byCategory,
        ] = await Promise.all([
            prisma.notification.count({ where: { workspaceId } }),
            prisma.notification.count({ where: { workspaceId, status: 'DRAFT' } }),
            prisma.notification.count({ where: { workspaceId, status: 'SCHEDULED' } }),
            prisma.notification.count({ where: { workspaceId, status: 'SENT' } }),
            prisma.notification.count({ where: { workspaceId, status: 'FAILED' } }),
            this.countByField(workspaceId, 'channel'),
            this.countByField(workspaceId, 'category'),
        ]);

        const deliveryStats = await this.getLogStats(workspaceId);

        return {
            notifications: { total: totalNotifications, draft, scheduled, sent, failed },
            delivery: deliveryStats,
            byChannel,
            byCategory,
        };
    }

    private async countByField(workspaceId: string, field: string) {
        const result = await prisma.notification.groupBy({
            by: [field as any],
            where: { workspaceId },
            _count: { id: true },
        });

        return result.reduce((acc, item: any) => {
            acc[item[field]] = item._count.id;
            return acc;
        }, {} as Record<string, number>);
    }

    // =========================================================================
    //  CHANNEL STATUS
    // =========================================================================

    getChannelStatus() {
        return channelRegistry.getChannelStatus();
    }

    // =========================================================================
    //  TEMPLATE RENDERING
    // =========================================================================

    /**
     * Render a template by replacing {{placeholder}} with data values.
     * Supports nested access: {{user.name}}, {{post.title}}
     */
    private renderTemplate(template: string, data: Record<string, any>): string {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], data);
            return value !== undefined && value !== null ? String(value) : match;
        });
    }

    // =========================================================================
    //  CONVENIENCE METHODS (for programmatic use)
    // =========================================================================

    /**
     * Quick send — create and send a notification in one call.
     * Great for programmatic/internal use.
     */
    async quickSend(workspaceId: string, userId: string, options: {
        channel: string;
        title: string;
        body: string;
        recipients: Recipient[];
        category?: string;
        priority?: string;
        richBody?: string;
        metadata?: Record<string, any>;
        referenceType?: string;
        referenceId?: string;
        tags?: string[];
    }) {
        return this.create(workspaceId, userId, {
            ...options,
            channel: options.channel as any,
            category: (options.category || 'GENERAL') as any,
            priority: (options.priority || 'NORMAL') as any,
            sendNow: true,
            isRecurring: false,
            tags: options.tags || [],
        });
    }

    /**
     * Send a team notification to all workspace members.
     */
    async notifyTeam(workspaceId: string, createdById: string, options: {
        title: string;
        body: string;
        channel?: string;
        category?: string;
        priority?: string;
        metadata?: Record<string, any>;
    }) {
        // Get all workspace members
        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId, isActive: true },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        });

        const channel = options.channel || 'IN_APP';
        const recipients: Recipient[] = members.map((m) => ({
            type: channel === 'EMAIL' ? 'email' as const : 'user' as const,
            value: channel === 'EMAIL' ? m.user.email : m.user.id,
            name: `${m.user.firstName} ${m.user.lastName}`,
        }));

        return this.quickSend(workspaceId, createdById, {
            ...options,
            channel,
            recipients,
            category: (options.category || 'TEAM') as any,
        });
    }

    /**
     * Create a reminder that sends at a future time.
     */
    async createReminder(workspaceId: string, userId: string, options: {
        title: string;
        body: string;
        scheduledAt: string;
        channel?: string;
        recipients: Recipient[];
        isRecurring?: boolean;
        recurrenceRule?: string;
        recurrenceEnd?: string;
        referenceType?: string;
        referenceId?: string;
        metadata?: Record<string, any>;
    }) {
        return this.create(workspaceId, userId, {
            ...options,
            channel: (options.channel || 'IN_APP') as any,
            category: 'REMINDER' as any,
            priority: 'NORMAL' as any,
            sendNow: false,
            isRecurring: options.isRecurring ?? false,
            tags: ['reminder'],
        });
    }
}

export const notificationService = new NotificationService();
