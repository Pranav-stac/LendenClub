/**
 * Instagram Webhook Handler
 * Handles webhook verification and event processing for Instagram
 */

import crypto from 'crypto';
import type { WebhookEvent, WebhookVerification } from '../base/types.js';
import type { InstagramWebhookChange, InstagramWebhookEntry } from './types.js';
import type { OAuthConfig } from '../base/types.js';
import { prisma } from '../../../../config/database.js';

export class InstagramWebhook {
  /**
   * Verify webhook signature and challenge
   * Instagram uses GET request with hub.verify_token for verification
   */
  verifyWebhook(req: any, config: OAuthConfig): boolean | string {
    // GET request = webhook verification
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === config.verifyToken) {
        return challenge; // Return challenge string for verification
      }

      return false;
    }

    // POST request = webhook event
    if (req.method === 'POST') {
      // Instagram webhooks don't use signature verification like Facebook
      // But we can verify the request came from Instagram by checking headers
      const userAgent = req.headers['user-agent'];
      if (userAgent && userAgent.includes('facebookexternalhit')) {
        return true;
      }

      // For additional security, you can verify the X-Hub-Signature-256 header
      // if you set up a secret in Meta Portal
      const signature = req.headers['x-hub-signature-256'];
      if (signature && config.verifyToken) {
        const hash = crypto
          .createHmac('sha256', config.verifyToken)
          .update(JSON.stringify(req.body))
          .digest('hex');
        const expectedSignature = `sha256=${hash}`;
        return signature === expectedSignature;
      }

      return true; // Allow if no signature verification is set up
    }

    return false;
  }

  /**
   * Process webhook event
   * Handles comments, messages, and other Instagram events
   */
  async processWebhook(event: WebhookEvent, connectionId: string): Promise<void> {
    try {
      const connection = await prisma.platformConnection.findUnique({
        where: { id: connectionId },
        include: { brand: true, platform: true },
      });

      if (!connection || !connection.isActive) {
        console.error(`Connection ${connectionId} not found or inactive`);
        return;
      }

      // Process each entry
      for (const entry of event.entry) {
        // Handle changes (comments, mentions, etc.)
        if (entry.changes && entry.changes.length > 0) {
          await this.processChanges(entry.changes, connection);
        }

        // Handle messaging events (DMs)
        if (entry.messaging && entry.messaging.length > 0) {
          await this.processMessaging(entry.messaging, connection);
        }
      }
    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
      throw error;
    }
  }

  /**
   * Process changes (comments, mentions, etc.)
   */
  private async processChanges(
    changes: InstagramWebhookChange[],
    connection: any
  ): Promise<void> {
    for (const change of changes) {
      switch (change.field) {
        case 'comments':
          await this.handleComment(change, connection);
          break;
        case 'live_comments':
          await this.handleLiveComment(change, connection);
          break;
        default:
          console.log(`Unhandled change field: ${change.field}`);
      }
    }
  }

  /**
   * Handle comment events
   */
  private async handleComment(
    change: InstagramWebhookChange,
    connection: any
  ): Promise<void> {
    const { value } = change;
    
    // Comment created
    if (value.item === 'comment' && value.comment_id) {
      // Fetch comment details from Instagram API
      // Store in database or trigger notification
      console.log('New comment received:', {
        commentId: value.comment_id,
        postId: value.media?.id,
        text: value.text,
        connectionId: connection.id,
      });

      // TODO: Store comment in database
      // TODO: Send notification to brand team
      // TODO: Trigger auto-reply if configured
    }
  }

  /**
   * Handle live comment events
   */
  private async handleLiveComment(
    change: InstagramWebhookChange,
    connection: any
  ): Promise<void> {
    const { value } = change;
    console.log('Live comment received:', {
      commentId: value.comment_id,
      text: value.text,
      connectionId: connection.id,
    });

    // TODO: Handle live comments during Instagram Live
  }

  /**
   * Process messaging events (Direct Messages)
   */
  private async processMessaging(
    messaging: any[],
    connection: any
  ): Promise<void> {
    for (const message of messaging) {
      // Handle different message types
      if (message.message) {
        await this.handleMessage(message, connection);
      } else if (message.postback) {
        await this.handlePostback(message, connection);
      } else if (message.reaction) {
        await this.handleReaction(message, connection);
      }
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: any, connection: any): Promise<void> {
    console.log('New message received:', {
      senderId: message.sender?.id,
      messageId: message.message?.mid,
      text: message.message?.text,
      connectionId: connection.id,
    });

    // TODO: Store message in database
    // TODO: Send notification
    // TODO: Trigger auto-reply if configured
  }

  /**
   * Handle postback (button clicks)
   */
  private async handlePostback(message: any, connection: any): Promise<void> {
    console.log('Postback received:', {
      senderId: message.sender?.id,
      payload: message.postback?.payload,
      connectionId: connection.id,
    });
  }

  /**
   * Handle reaction (emoji reactions)
   */
  private async handleReaction(message: any, connection: any): Promise<void> {
    console.log('Reaction received:', {
      senderId: message.sender?.id,
      reaction: message.reaction?.reaction,
      messageId: message.reaction?.mid,
      connectionId: connection.id,
    });
  }
}

