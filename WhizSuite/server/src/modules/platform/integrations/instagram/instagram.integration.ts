/**
 * Instagram Integration
 * Main integration class that combines OAuth, API, and Webhook functionality
 */

import type {
  OAuthState,
  OAuthConfig,
  PlatformConnectionData,
  PlatformTokens,
  PlatformUser,
  PublishPostOptions,
  PublishedPost,
  WebhookEvent,
} from '../base/types.js';
import { InstagramOAuth } from './instagram.oauth.js';
import { InstagramAPI } from './instagram.api.js';
import { InstagramWebhook } from './instagram.webhook.js';

export class InstagramIntegration {
  private oauth: InstagramOAuth;
  private api: InstagramAPI;
  private webhook: InstagramWebhook;

  constructor() {
    this.oauth = new InstagramOAuth();
    this.api = new InstagramAPI();
    this.webhook = new InstagramWebhook();
  }

  getPlatformName(): string {
    return 'instagram';
  }

  // OAuth methods
  async getAuthUrl(state: OAuthState, config: OAuthConfig): Promise<string> {
    return this.oauth.getAuthUrl(state, config);
  }

  async exchangeCodeForTokens(
    code: string,
    config: OAuthConfig,
    state?: OAuthState
  ): Promise<PlatformConnectionData> {
    return this.oauth.exchangeCodeForTokens(code, config, state);
  }

  async refreshToken(
    refreshToken: string,
    config: OAuthConfig
  ): Promise<PlatformTokens> {
    return this.oauth.refreshToken(refreshToken, config);
  }

  async getUserProfile(
    accessToken: string,
    config?: OAuthConfig
  ): Promise<PlatformUser> {
    return this.oauth.getUserProfile(accessToken, config);
  }

  // API methods
  async publishPost(
    accessToken: string,
    options: PublishPostOptions,
    config?: OAuthConfig
  ): Promise<PublishedPost> {
    return this.api.publishPost(accessToken, options, config);
  }

  // Webhook methods
  verifyWebhook(req: any, config: OAuthConfig): boolean | string {
    return this.webhook.verifyWebhook(req, config);
  }

  async processWebhook(
    event: WebhookEvent,
    connectionId: string
  ): Promise<void> {
    return this.webhook.processWebhook(event, connectionId);
  }

  // Token revocation
  async revokeToken(accessToken: string, config: OAuthConfig): Promise<void> {
    // Instagram doesn't have a direct revoke endpoint
    // We just mark the connection as inactive in our database
    // The token will expire naturally
    return Promise.resolve();
  }
}

