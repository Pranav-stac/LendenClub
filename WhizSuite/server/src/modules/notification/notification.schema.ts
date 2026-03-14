import { z } from 'zod';

// ============ ENUMS ============

export const NotificationChannel = z.enum([
    'EMAIL',
    'WHATSAPP',
    'IN_APP',
    'SMS',
    'PUSH',
    'WEBHOOK',
]);

export const NotificationCategory = z.enum([
    'GENERAL',
    'REMINDER',
    'TEAM',
    'POST',
    'DEADLINE',
    'ALERT',
    'CUSTOM',
]);

export const NotificationPriority = z.enum([
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT',
]);

export const NotificationStatus = z.enum([
    'DRAFT',
    'SCHEDULED',
    'SENDING',
    'SENT',
    'PARTIALLY_SENT',
    'FAILED',
    'CANCELLED',
]);

export const RecipientType = z.enum([
    'user',
    'email',
    'phone',
    'webhook',
]);

// ============ SUB-SCHEMAS ============

const recipientSchema = z.object({
    type: RecipientType,
    value: z.string().min(1, 'Recipient value is required'),
    name: z.string().optional(),
});

const recurrenceSchema = z.object({
    isRecurring: z.boolean().default(false),
    recurrenceRule: z.string().optional(),  // RRULE: FREQ=DAILY;INTERVAL=1;COUNT=10
    recurrenceEnd: z.string().datetime().optional(),
});

// ============ CREATE NOTIFICATION ============

export const createNotificationSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500),
    body: z.string().min(1, 'Body is required'),
    richBody: z.string().optional(),

    channel: NotificationChannel,
    recipients: z.array(recipientSchema).min(1, 'At least one recipient is required'),

    category: NotificationCategory.optional().default('GENERAL'),
    priority: NotificationPriority.optional().default('NORMAL'),

    // Scheduling
    scheduledAt: z.string().datetime().optional(),
    sendNow: z.boolean().optional().default(false),

    // Recurrence
    isRecurring: z.boolean().optional().default(false),
    recurrenceRule: z.string().optional(),
    recurrenceEnd: z.string().datetime().optional(),

    // Template
    templateId: z.string().optional(),
    templateData: z.record(z.string(), z.any()).optional(),

    // References
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),

    // Metadata
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional().default([]),
});

// ============ UPDATE NOTIFICATION ============

export const updateNotificationSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    body: z.string().min(1).optional(),
    richBody: z.string().optional().nullable(),

    channel: NotificationChannel.optional(),
    recipients: z.array(recipientSchema).min(1).optional(),

    category: NotificationCategory.optional(),
    priority: NotificationPriority.optional(),

    scheduledAt: z.string().datetime().optional().nullable(),

    isRecurring: z.boolean().optional(),
    recurrenceRule: z.string().optional().nullable(),
    recurrenceEnd: z.string().datetime().optional().nullable(),

    templateId: z.string().optional().nullable(),
    templateData: z.record(z.string(), z.any()).optional().nullable(),

    referenceType: z.string().optional().nullable(),
    referenceId: z.string().optional().nullable(),

    metadata: z.record(z.string(), z.any()).optional().nullable(),
    tags: z.array(z.string()).optional(),
});

// ============ TEMPLATE SCHEMAS ============

export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required').max(200),
    slug: z.string().min(1, 'Slug is required').max(200)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
    description: z.string().optional(),

    channel: NotificationChannel,
    category: NotificationCategory.optional().default('GENERAL'),

    subject: z.string().optional(), // For emails
    body: z.string().min(1, 'Template body is required'),
    richBody: z.string().optional(),

    // WhatsApp-specific
    whatsappTemplateName: z.string().optional(),
    whatsappLanguage: z.string().optional().default('en'),
});

export const updateTemplateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),

    channel: NotificationChannel.optional(),
    category: NotificationCategory.optional(),

    subject: z.string().optional().nullable(),
    body: z.string().min(1).optional(),
    richBody: z.string().optional().nullable(),

    whatsappTemplateName: z.string().optional().nullable(),
    whatsappLanguage: z.string().optional().nullable(),

    isActive: z.boolean().optional(),
});

// ============ BULK SEND SCHEMA ============

export const bulkSendSchema = z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
});

// ============ QUERY FILTERS ============

export const notificationQuerySchema = z.object({
    channel: NotificationChannel.optional(),
    category: NotificationCategory.optional(),
    status: NotificationStatus.optional(),
    priority: NotificationPriority.optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    tags: z.string().optional(), // Comma-separated
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ============ TYPES ============

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type BulkSendInput = z.infer<typeof bulkSendSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

export type Recipient = z.infer<typeof recipientSchema>;
