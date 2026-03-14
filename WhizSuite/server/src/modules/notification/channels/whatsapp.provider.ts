import type { IChannelProvider, SendPayload, SendResult } from './channel.interface.js';

/**
 * WhatsApp Channel Provider
 * 
 * Uses the WhatsApp Business API (Graph API) to send messages.
 * Configure via environment variables:
 *   WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION
 * 
 * Supports:
 *   - Template messages (required for first contact)
 *   - Free-form text messages (within 24h window)
 */
export class WhatsAppProvider implements IChannelProvider {
    readonly channelName = 'WHATSAPP';
    readonly providerName = 'whatsapp-graph-api';

    private apiToken: string;
    private phoneNumberId: string;
    private apiVersion: string;

    constructor() {
        this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

        if (!this.isConfigured()) {
            console.warn('⚠️  WhatsApp provider: API credentials not configured. WhatsApp sending is disabled.');
        } else {
            console.log('✅ WhatsApp provider initialized');
        }
    }

    isConfigured(): boolean {
        return !!(this.apiToken && this.phoneNumberId);
    }

    async send(payload: SendPayload): Promise<SendResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                providerName: this.providerName,
                error: 'WhatsApp provider is not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
            };
        }

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            let messageBody: any;

            // If a WhatsApp template is specified, use template message
            if (payload.whatsappTemplateName) {
                messageBody = {
                    messaging_product: 'whatsapp',
                    to: this.normalizePhone(payload.to),
                    type: 'template',
                    template: {
                        name: payload.whatsappTemplateName,
                        language: { code: payload.whatsappLanguage || 'en' },
                        ...(payload.whatsappTemplateData?.components && {
                            components: payload.whatsappTemplateData.components,
                        }),
                    },
                };
            } else {
                // Free-form text message (only works within 24h conversation window)
                messageBody = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: this.normalizePhone(payload.to),
                    type: 'text',
                    text: {
                        preview_url: true,
                        body: payload.body,
                    },
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify(messageBody),
            });

            const data = await response.json() as any;

            if (!response.ok) {
                return {
                    success: false,
                    providerName: this.providerName,
                    error: data?.error?.message || `WhatsApp API error: ${response.status}`,
                    metadata: data,
                };
            }

            return {
                success: true,
                providerMessageId: data?.messages?.[0]?.id,
                providerName: this.providerName,
                metadata: data,
            };
        } catch (error: any) {
            return {
                success: false,
                providerName: this.providerName,
                error: error.message || 'Failed to send WhatsApp message',
            };
        }
    }

    /**
     * Normalize phone number to E.164 format
     */
    private normalizePhone(phone: string): string {
        // Remove all non-digit chars except leading +
        let cleaned = phone.replace(/[^\d+]/g, '');
        // Ensure starts with country code
        if (!cleaned.startsWith('+')) {
            // Default: assume Indian number if 10 digits
            if (cleaned.length === 10) {
                cleaned = '91' + cleaned;
            }
        } else {
            cleaned = cleaned.substring(1); // Remove + for API
        }
        return cleaned;
    }
}
