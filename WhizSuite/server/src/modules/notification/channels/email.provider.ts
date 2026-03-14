import type { IChannelProvider, SendPayload, SendResult } from './channel.interface.js';
import nodemailer from 'nodemailer';

/**
 * Email Channel Provider
 * 
 * Uses nodemailer under the hood. Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * 
 * For production, integrate with services like:
 *   - AWS SES
 *   - SendGrid
 *   - Mailgun
 *   - Resend
 */
export class EmailProvider implements IChannelProvider {
    readonly channelName = 'EMAIL';
    readonly providerName = 'nodemailer';

    private transporter: any = null;

    constructor() {
        this.initTransporter();
    }

    private initTransporter() {
        try {
            const host = process.env.SMTP_HOST;
            const port = parseInt(process.env.SMTP_PORT || '587', 10);
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;

            if (!host || !user || !pass) {
                console.warn('⚠️  Email provider: SMTP credentials not configured. Email sending is disabled.');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });

            console.log('✅ Email provider initialized');
        } catch (error: any) {
            console.warn('⚠️  Email provider: SMTP configuration failed.', (error as Error)?.message);
        }
    }

    isConfigured(): boolean {
        return this.transporter !== null;
    }

    async send(payload: SendPayload): Promise<SendResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                providerName: this.providerName,
                error: 'Email provider is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.',
            };
        }

        try {
            const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@whizsuite.com';

            const mailOptions: any = {
                from: `WhizSuite <${from}>`,
                to: payload.toName ? `${payload.toName} <${payload.to}>` : payload.to,
                subject: payload.subject || payload.body.substring(0, 100),
                text: payload.body,
            };

            if (payload.richBody) {
                mailOptions.html = payload.richBody;
            }

            // Support attachments via metadata
            if (payload.metadata?.attachments) {
                mailOptions.attachments = payload.metadata.attachments;
            }

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                providerMessageId: info.messageId,
                providerName: this.providerName,
                metadata: { accepted: info.accepted, rejected: info.rejected },
            };
        } catch (error: any) {
            return {
                success: false,
                providerName: this.providerName,
                error: error.message || 'Failed to send email',
            };
        }
    }

    async sendBulk(payloads: SendPayload[]): Promise<SendResult[]> {
        // Send in parallel with concurrency limit
        const results: SendResult[] = [];
        const batchSize = 10;

        for (let i = 0; i < payloads.length; i += batchSize) {
            const batch = payloads.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((p) => this.send(p)));
            results.push(...batchResults);
        }

        return results;
    }
}
