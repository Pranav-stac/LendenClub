/**
 * Channel Provider Interface
 * 
 * All notification channel providers must implement this interface.
 * To add a new channel (e.g., Slack, Discord, Telegram), just create 
 * a new class implementing IChannelProvider and register it in the registry.
 */

export interface SendPayload {
    to: string;            // Recipient address (email, phone, userId, webhook URL)
    toName?: string;       // Optional: Recipient display name
    subject?: string;      // Email subject / notification title
    body: string;          // Plain text body
    richBody?: string;     // HTML body (for email) or formatted body
    priority?: string;     // LOW, NORMAL, HIGH, URGENT
    metadata?: Record<string, any>; // Extra data (buttons, links, images, etc.)

    // WhatsApp-specific
    whatsappTemplateName?: string;
    whatsappTemplateData?: Record<string, any>;
    whatsappLanguage?: string;

    // Webhook-specific
    webhookHeaders?: Record<string, string>;
    webhookMethod?: 'POST' | 'PUT';
}

export interface SendResult {
    success: boolean;
    providerMessageId?: string;
    providerName: string;
    error?: string;
    metadata?: Record<string, any>;
}

export interface IChannelProvider {
    /** Unique channel name matching the enum */
    readonly channelName: string;

    /** Human-readable provider name */
    readonly providerName: string;

    /** Check if this provider is properly configured and ready */
    isConfigured(): boolean;

    /** Send a single notification */
    send(payload: SendPayload): Promise<SendResult>;

    /** Send to multiple recipients (optional, defaults to sequential sends) */
    sendBulk?(payloads: SendPayload[]): Promise<SendResult[]>;
}
