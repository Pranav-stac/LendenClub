/**
 * Base types for platform integrations
 * These types define the contract that all platform integrations must follow
 */

export interface PlatformTokens {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  tokenType?: string;
}

export interface PlatformUser {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  profileUrl?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}

export interface PlatformConnectionData {
  tokens: PlatformTokens;
  user: PlatformUser;
  metadata?: Record<string, any>;
}

export interface OAuthState {
  brandId: string;
  userId: string;
  platform: string;
  redirectUri?: string;
  [key: string]: any;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiVersion?: string;
  verifyToken?: string; // For webhook verification
  appId?: string; // For Facebook/Meta apps
}

export interface UserTag {
  username: string;
  x: number; // 0.0–1.0 from left
  y: number; // 0.0–1.0 from top
}

export interface PublishPostOptions {
  content: string;
  postType?: 'post' | 'carousel' | 'reel' | 'trial_reel' | 'story';
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledAt?: Date;
  coverUrl?: string;
  altText?: string;
  shareToFeed?: boolean;
  trialGraduationStrategy?: 'MANUAL' | 'SS_PERFORMANCE';
  // Reel-specific
  audioName?: string;
  userTags?: UserTag[];
  locationId?: string;
  collaborators?: string[];
  thumbOffset?: number; // milliseconds
  metadata?: Record<string, any>;
}

export interface PublishedPost {
  platformPostId: string;
  url?: string;
  publishedAt: Date;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging?: any[];
    changes?: any[];
    [key: string]: any;
  }>;
}

export interface WebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export interface PlatformIntegration {
  /**
   * Get the platform name
   */
  getPlatformName(): string;

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: OAuthState, config: OAuthConfig): Promise<string>;

  /**
   * Exchange authorization code for access tokens
   */
  exchangeCodeForTokens(code: string, config: OAuthConfig, state?: OAuthState): Promise<PlatformConnectionData>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string, config: OAuthConfig): Promise<PlatformTokens>;

  /**
   * Get user profile information
   */
  getUserProfile(accessToken: string, config?: OAuthConfig): Promise<PlatformUser>;

  /**
   * Publish a post to the platform
   */
  publishPost(accessToken: string, options: PublishPostOptions, config?: OAuthConfig): Promise<PublishedPost>;

  /**
   * Verify webhook signature/verification token
   */
  verifyWebhook(req: any, config: OAuthConfig): boolean | string;

  /**
   * Process webhook event
   */
  processWebhook(event: WebhookEvent, connectionId: string): Promise<void>;

  /**
   * Revoke/disconnect the connection
   */
  revokeToken(accessToken: string, config: OAuthConfig): Promise<void>;
}

