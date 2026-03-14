/**
 * Instagram OAuth Implementation
 * Handles Instagram Business Login OAuth flow
 */

import type { OAuthState, OAuthConfig, PlatformConnectionData } from '../base/types.js';
import type { InstagramOAuthResponse, InstagramUser, InstagramPage } from './types.js';
import { BaseIntegration } from '../base/base.integration.js';

export class InstagramOAuth {
  // Helper methods from BaseIntegration
  protected calculateExpiry(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
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
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

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

  protected buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }
  /**
   * Generate Instagram Business Login authorization URL
   * For Instagram Business accounts, we use Facebook Login
   * because Instagram Business accounts are linked to Facebook Pages
   */
  async getAuthUrl(state: OAuthState, config: OAuthConfig): Promise<string> {
    const apiVersion = config.apiVersion || 'v18.0';

    // Use Facebook Login for Instagram Business accounts
    // This is required because Instagram Business accounts are connected to Facebook Pages
    const params = {
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(','),
      state: this.encodeState(state),
      auth_type: 'rerequest', // Re-request permissions if needed
    };

    const queryString = this.buildQueryString(params);
    // Use Facebook OAuth endpoint for Instagram Business
    return `https://www.facebook.com/${apiVersion}/dialog/oauth?${queryString}`;
  }

  /**
   * Exchange authorization code for access token
   * Instagram Business Login flow:
   * 1. Exchange code for short-lived token (Instagram API)
   * 2. Exchange for long-lived token (Facebook Graph API)
   * 3. Get associated Facebook Page
   * 4. Get Instagram Business Account from Page
   */
  async exchangeCodeForTokens(
    code: string,
    config: OAuthConfig,
    state?: OAuthState
  ): Promise<PlatformConnectionData> {
    const apiVersion = config.apiVersion || 'v18.0';

    // Step 1: Exchange code for short-lived user access token via Facebook Graph API
    // This is because Instagram Business accounts require Facebook Login
    const tokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

    const tokenParams = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    };

    const tokenResponse = await this.makeRequest(
      `${tokenUrl}?${this.buildQueryString(tokenParams)}`
    );

    const shortLivedToken = tokenResponse.access_token;
    const expiresIn = tokenResponse.expires_in || 3600;

    // Step 2: Exchange short-lived user token for long-lived user token (60 days)
    const longLivedUserToken = await this.getLongLivedUserToken(
      shortLivedToken,
      config,
      apiVersion
    );

    // Step 3: Get user's Facebook Pages (required for Instagram Business)
    const pages = await this.getFacebookPages(longLivedUserToken, apiVersion);

    if (!pages || pages.length === 0) {
      throw new Error(
        'No Facebook Pages found. Please ensure your Facebook account has at least one Page connected to an Instagram Business Account.'
      );
    }

    // Step 4: Find page with Instagram Business Account
    const pageWithIG = pages.find((page: any) => page.instagram_business_account);

    if (!pageWithIG?.instagram_business_account) {
      // Provide detailed error with page information
      const pageNames = pages.map((p: any) => p.name).join(', ');
      const pagesWithoutIG = pages.filter((p: any) => !p.instagram_business_account);

      let errorMessage = `No Instagram Business Account found. You have ${pages.length} Facebook Page(s): ${pageNames}. `;

      if (pagesWithoutIG.length === pages.length) {
        errorMessage += 'None of these Pages are connected to an Instagram Business Account. ';
      }

      errorMessage += 'To fix this: (1) Open Instagram app → Settings → Account → Linked Accounts → Facebook, (2) Connect your Instagram Business account to one of your Facebook Pages, (3) Try connecting again.';

      throw new Error(errorMessage);
    }

    // Step 5: Get Instagram Business Account details
    const igAccountId = pageWithIG.instagram_business_account.id;
    const igAccount = await this.getInstagramAccountDetails(
      pageWithIG.access_token, // Use page access token
      igAccountId,
      apiVersion
    );

    // Step 6: Get page access token for this specific page (needed for publishing)
    const pageAccessToken = pageWithIG.access_token;

    return {
      tokens: {
        accessToken: pageAccessToken, // Use page access token for API calls
        refreshToken: longLivedUserToken, // Store long-lived user token as refresh token
        tokenExpiry: this.calculateExpiry(60 * 24 * 60), // 60 days
        tokenType: 'Bearer',
      },
      user: {
        id: igAccount.id,
        username: igAccount.username,
        name: igAccount.name,
        profileUrl: `https://www.instagram.com/${igAccount.username}/`,
        avatarUrl: igAccount.profile_picture_url,
        metadata: {
          account_type: igAccount.account_type || 'BUSINESS',
          instagram_business_account_id: igAccount.id,
          facebook_page_id: pageWithIG.id,
          facebook_page_name: pageWithIG.name,
        },
      },
      metadata: {
        instagramAccount: igAccount,
        facebookPage: {
          id: pageWithIG.id,
          name: pageWithIG.name,
          accessToken: pageAccessToken,
        },
        longLivedUserToken: longLivedUserToken, // Store for token refresh
      },
    };
  }

  /**
   * Get long-lived user access token (60 days)
   * Exchanges short-lived Facebook user token for long-lived user token
   */
  private async getLongLivedUserToken(
    shortLivedToken: string,
    config: OAuthConfig,
    apiVersion: string
  ): Promise<string> {
    const exchangeUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

    const params = {
      grant_type: 'fb_exchange_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      fb_exchange_token: shortLivedToken,
    };

    const response = await this.makeRequest(
      `${exchangeUrl}?${this.buildQueryString(params)}`
    );

    return response.access_token;
  }

  /**
   * Get user's Facebook Pages
   * Checks both personal pages and Business Manager pages
   */
  private async getFacebookPages(
    accessToken: string,
    apiVersion: string
  ): Promise<InstagramPage[]> {
    // First, try to get pages from personal account
    const pagesUrl = `https://graph.facebook.com/${apiVersion}/me/accounts`;
    const pagesResponse = await this.makeRequest(
      `${pagesUrl}?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account{id,username}`
    );

    let pages = pagesResponse.data || [];

    // If no personal pages found, try to get pages from Business Manager
    if (pages.length === 0) {
      try {
        // Get user's businesses
        const businessesUrl = `https://graph.facebook.com/${apiVersion}/me/businesses`;
        const businessesResponse = await this.makeRequest(
          `${businessesUrl}?access_token=${accessToken}&fields=id,name`
        );

        const businesses = businessesResponse.data || [];

        // For each business, get its pages
        for (const business of businesses) {
          const businessPagesUrl = `https://graph.facebook.com/${apiVersion}/${business.id}/client_pages`;
          const businessPagesResponse = await this.makeRequest(
            `${businessPagesUrl}?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account{id,username}`
          );

          if (businessPagesResponse.data) {
            pages = pages.concat(businessPagesResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching Business Manager pages:', error);
        // Continue with empty pages array
      }
    }

    return pages;
  }

  /**
   * Get Instagram Business Account details
   */
  private async getInstagramAccountDetails(
    accessToken: string,
    accountId: string,
    apiVersion: string
  ): Promise<{ id: string; username: string; account_type?: string; name?: string; profile_picture_url?: string }> {
    const accountUrl = `https://graph.facebook.com/${apiVersion}/${accountId}`;
    const accountResponse = await this.makeRequest(
      `${accountUrl}?access_token=${accessToken}&fields=id,username,name,profile_picture_url`
    );

    return {
      ...accountResponse,
      account_type: accountResponse.account_type || 'BUSINESS', // Default to BUSINESS if not provided
    };
  }

  /**
   * Get user profile information
   * Requires page access token with instagram_business_account
   */
  async getUserProfile(
    accessToken: string,
    config?: OAuthConfig
  ): Promise<InstagramUser> {
    const apiVersion = config?.apiVersion || 'v18.0';

    // Get pages to find the one with Instagram Business Account
    const pagesUrl = `https://graph.facebook.com/${apiVersion}/me/accounts`;
    const pagesResponse = await this.makeRequest(
      `${pagesUrl}?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username,profile_picture_url}`
    );

    const pageWithIG = pagesResponse.data?.find(
      (page: InstagramPage) => page.instagram_business_account
    );

    if (!pageWithIG?.instagram_business_account) {
      throw new Error('Instagram Business Account not found. Please ensure your Facebook Page is connected to an Instagram Business Account.');
    }

    const igAccount = pageWithIG.instagram_business_account;

    // Get account details using the Instagram Business Account ID
    const accountUrl = `https://graph.facebook.com/${apiVersion}/${igAccount.id}`;
    const accountResponse = await this.makeRequest(
      `${accountUrl}?access_token=${accessToken}&fields=id,username,name,profile_picture_url`
    );

    return {
      id: accountResponse.id,
      username: accountResponse.username,
      account_type: accountResponse.account_type || 'BUSINESS',
      name: accountResponse.name,
      profile_picture_url: accountResponse.profile_picture_url,
    };
  }

  /**
   * Refresh long-lived token (before it expires)
   */
  async refreshToken(
    refreshToken: string,
    config: OAuthConfig
  ): Promise<{ accessToken: string; refreshToken?: string; tokenExpiry?: Date }> {
    // Instagram long-lived tokens can be refreshed
    // We need the current access token, not a refresh token
    // This method should be called with the current access token
    const apiVersion = config.apiVersion || 'v18.0';
    const refreshUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;

    const params = {
      grant_type: 'ig_refresh_token',
      access_token: refreshToken, // In Instagram's case, this is the current access token
    };

    const response = await this.makeRequest(
      `${refreshUrl}?${this.buildQueryString(params)}`
    );

    return {
      accessToken: response.access_token,
      tokenExpiry: this.calculateExpiry(response.expires_in || 60 * 24 * 60),
    };
  }

  /**
   * Encode state for OAuth flow
   */
  private encodeState(state: OAuthState): string {
    return Buffer.from(JSON.stringify(state)).toString('base64');
  }

  /**
   * Decode state from OAuth callback
   */
  decodeState(encodedState: string): OAuthState {
    try {
      return JSON.parse(Buffer.from(encodedState, 'base64').toString());
    } catch (error) {
      throw new Error('Invalid state parameter');
    }
  }
}

