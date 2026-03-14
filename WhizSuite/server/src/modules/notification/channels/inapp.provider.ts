import type { IChannelProvider, SendPayload, SendResult } from './channel.interface.js';
import { prisma } from '../../../config/database.js';

/**
 * In-App Notification Provider
 * 
 * Stores notifications in the database for retrieval by the frontend.
 * This is always configured and available — no external service needed.
 * 
 * The frontend can poll or use WebSockets to fetch in-app notifications.
 * All in-app notifications are persisted as NotificationLog entries 
 * with channel='IN_APP', which can be queried by userId.
 */
export class InAppProvider implements IChannelProvider {
    readonly channelName = 'IN_APP';
    readonly providerName = 'database';

    isConfigured(): boolean {
        // Always available — uses the database
        return true;
    }

    async send(payload: SendPayload): Promise<SendResult> {
        try {
            // For in-app notifications, the "to" field is the userId.
            // The notification is already stored in the Notification table.
            // The NotificationLog entry acts as the per-user delivery record.
            // The service layer handles creating the log entry, so here we 
            // just validate and return success.

            if (!payload.to) {
                return {
                    success: false,
                    providerName: this.providerName,
                    error: 'User ID is required for in-app notifications',
                };
            }

            // Verify user exists
            const user = await prisma.user.findUnique({
                where: { id: payload.to },
                select: { id: true },
            });

            if (!user) {
                return {
                    success: false,
                    providerName: this.providerName,
                    error: `User not found: ${payload.to}`,
                };
            }

            return {
                success: true,
                providerName: this.providerName,
                providerMessageId: `inapp_${Date.now()}_${payload.to}`,
                metadata: {
                    userId: payload.to,
                    title: payload.subject,
                    body: payload.body,
                    priority: payload.priority,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                providerName: this.providerName,
                error: error.message || 'Failed to create in-app notification',
            };
        }
    }
}
