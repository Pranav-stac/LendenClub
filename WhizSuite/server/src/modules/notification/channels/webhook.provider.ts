import type { IChannelProvider, SendPayload, SendResult } from './channel.interface.js';

/**
 * Webhook Channel Provider
 * 
 * Sends notification data to arbitrary webhook URLs via HTTP POST/PUT.
 * Useful for integrating with:
 *   - Slack (incoming webhooks)
 *   - Discord (webhooks)
 *   - Zapier / Make / n8n
 *   - Custom internal services
 *   - Any HTTP endpoint
 */
export class WebhookProvider implements IChannelProvider {
    readonly channelName = 'WEBHOOK';
    readonly providerName = 'http-webhook';

    isConfigured(): boolean {
        // Always available — recipient URL is provided per-notification
        return true;
    }

    async send(payload: SendPayload): Promise<SendResult> {
        try {
            const url = payload.to;

            if (!url || !this.isValidUrl(url)) {
                return {
                    success: false,
                    providerName: this.providerName,
                    error: `Invalid webhook URL: ${url}`,
                };
            }

            const webhookBody = {
                title: payload.subject || '',
                body: payload.body,
                richBody: payload.richBody,
                priority: payload.priority,
                timestamp: new Date().toISOString(),
                ...(payload.metadata || {}),
            };

            const method = payload.webhookMethod || 'POST';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'WhizSuite-Notifications/1.0',
                ...(payload.webhookHeaders || {}),
            };

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(webhookBody),
                signal: AbortSignal.timeout(30000), // 30s timeout
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                return {
                    success: false,
                    providerName: this.providerName,
                    error: `Webhook returned ${response.status}: ${errorText.substring(0, 500)}`,
                    metadata: { statusCode: response.status },
                };
            }

            return {
                success: true,
                providerName: this.providerName,
                providerMessageId: `webhook_${Date.now()}`,
                metadata: { statusCode: response.status },
            };
        } catch (error: any) {
            return {
                success: false,
                providerName: this.providerName,
                error: error.message || 'Webhook request failed',
            };
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
