/**
 * Base Integration Class
 * Abstract base class that all platform integrations must extend
 * Provides common functionality and enforces the integration contract
 */

import type {
  PlatformIntegration,
  PlatformTokens,
  PlatformUser,
  PlatformConnectionData,
  OAuthState,
  OAuthConfig,
  PublishPostOptions,
  PublishedPost,
  WebhookEvent,
} from './types.js';

export abstract class BaseIntegration implements PlatformIntegration {
  abstract getPlatformName(): string;

  abstract getAuthUrl(state: OAuthState, config: OAuthConfig): Promise<string>;

  abstract exchangeCodeForTokens(
    code: string,
    config: OAuthConfig,
    state?: OAuthState
  ): Promise<PlatformConnectionData>;

  abstract refreshToken(refreshToken: string, config: OAuthConfig): Promise<PlatformTokens>;

  abstract getUserProfile(accessToken: string, config?: OAuthConfig): Promise<PlatformUser>;

  abstract publishPost(
    accessToken: string,
    options: PublishPostOptions,
    config?: OAuthConfig
  ): Promise<PublishedPost>;

  abstract verifyWebhook(req: any, config: OAuthConfig): boolean | string;

  abstract processWebhook(event: WebhookEvent, connectionId: string): Promise<void>;

  abstract revokeToken(accessToken: string, config: OAuthConfig): Promise<void>;

  /**
   * Helper: Check if token is expired or about to expire
   */
  protected isTokenExpired(tokenExpiry?: Date, bufferMinutes: number = 5): boolean {
    if (!tokenExpiry) return false;
    const bufferMs = bufferMinutes * 60 * 1000;
    return new Date() >= new Date(tokenExpiry.getTime() - bufferMs);
  }

  /**
   * Helper: Calculate token expiry date
   */
  protected calculateExpiry(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }

  /**
   * Helper: Make HTTP request with error handling
   */
  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Helper: Build query string from object
   */
  protected buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }
}





