/**
 * Platform Service
 * Orchestrates platform connections using the integration system
 */

import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import { config } from '../../config/index.js';
import { getIntegration } from './integrations/index.js';
import type { OAuthConfig, OAuthState } from './integrations/base/types.js';

export class PlatformService {
  async getAllPlatforms() {
    const platforms = await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return platforms;
  }

  async ensurePlatformsExist() {
    const platformCount = await prisma.platform.count();
    if (platformCount === 0) {
      throw new Error(
        'No platforms found in database. Please run: cd server && npx prisma db seed'
      );
    }
  }

  /**
   * Get OAuth configuration for a platform
   */
  private getOAuthConfig(platformName: string): OAuthConfig {
    const baseUrl = config.frontend.url;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${config.port}`;
    const redirectUri = `${backendUrl}/api/platforms/callback`;

    switch (platformName.toLowerCase()) {
      case 'instagram':
        // For Instagram Business, we MUST use Facebook App ID (not Instagram App ID)
        // Instagram Business accounts require Facebook Login
        return {
          clientId: config.oauth.facebook.appId || config.oauth.instagram.appId,
          clientSecret: config.oauth.facebook.appSecret || config.oauth.instagram.appSecret,
          redirectUri,
          scopes: [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'pages_read_user_content',
            'business_management', // Access to Business Manager pages
            'instagram_basic',
            'instagram_content_publish',
            'instagram_manage_comments',
            'instagram_manage_messages',
          ],
          apiVersion: config.oauth.instagram.apiVersion,
        };
      case 'facebook':
        return {
          clientId: config.oauth.facebook.appId,
          clientSecret: config.oauth.facebook.appSecret,
          redirectUri,
          scopes: ['pages_manage_posts', 'pages_read_engagement'],
        };
      default:
        throw new Error(`OAuth config not found for platform: ${platformName}`);
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  async getAuthUrl(platform: string, brandId: string, userId: string): Promise<string> {
    const integration = getIntegration(platform);
    if (!integration) {
      throw new Error(`Integration not found for platform: ${platform}`);
    }

    const oauthConfig = this.getOAuthConfig(platform);

    // Validate OAuth config
    if (!oauthConfig.clientId || oauthConfig.clientId.trim() === '') {
      if (platform.toLowerCase() === 'instagram') {
        throw new Error(
          'Facebook App ID is required for Instagram Business. ' +
          'Please set FACEBOOK_APP_ID in your .env file. ' +
          'Instagram Business accounts require Facebook Login, so use your Facebook App ID (not Instagram App ID).'
        );
      }
      throw new Error(`App ID not configured for platform: ${platform}`);
    }

    if (!oauthConfig.clientSecret || oauthConfig.clientSecret.trim() === '') {
      throw new Error(`App Secret not configured for platform: ${platform}`);
    }

    const state: OAuthState = {
      brandId,
      userId,
      platform: platform.toLowerCase(),
      redirectUri: oauthConfig.redirectUri,
    };

    return integration.getAuthUrl(state, oauthConfig);
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string) {
    try {
      // Decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { brandId, userId, platform } = stateData;

      // Get integration
      const integration = getIntegration(platform);
      if (!integration) {
        throw new Error(`Integration not found for platform: ${platform}`);
      }

      // Get OAuth config
      const oauthConfig = this.getOAuthConfig(platform);

      // Exchange code for tokens
      const connectionData = await integration.exchangeCodeForTokens(
        code,
        oauthConfig,
        stateData
      );

      // Find platform record
      const platformRecord = await prisma.platform.findFirst({
        where: { name: { equals: platform, mode: 'insensitive' } },
      });

      if (!platformRecord) {
        throw new Error(`Platform ${platform} not found in database`);
      }

      // Verify brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new Error(`Brand with ID "${brandId}" not found`);
      }

      // Check for existing connection (active or inactive) to avoid unique constraint violation
      const existing = await prisma.platformConnection.findFirst({
        where: {
          brandId,
          platformId: platformRecord.id,
        },
      });

      if (existing) {
        // Update existing connection
        return prisma.platformConnection.update({
          where: { id: existing.id },
          data: {
            accessToken: connectionData.tokens.accessToken,
            refreshToken: connectionData.tokens.refreshToken,
            tokenExpiry: connectionData.tokens.tokenExpiry,
            platformUserId: connectionData.user.id,
            platformUsername: connectionData.user.username,
            profileUrl: connectionData.user.profileUrl,
            metadata: {
              ...(existing.metadata as any || {}),
              ...connectionData.metadata,
              user: connectionData.user as any, // Serialize for JSON storage
            },
            isActive: false, // Require activation in settings after connection
          },
          include: {
            platform: true,
            brand: true,
          },
        });
      }

      // Create new connection
      return prisma.platformConnection.create({
        data: {
          id: nanoid(),
          brandId,
          platformId: platformRecord.id,
          accessToken: connectionData.tokens.accessToken,
          refreshToken: connectionData.tokens.refreshToken,
          tokenExpiry: connectionData.tokens.tokenExpiry,
          platformUserId: connectionData.user.id,
          platformUsername: connectionData.user.username,
          profileUrl: connectionData.user.profileUrl,
          metadata: {
            ...connectionData.metadata,
            user: connectionData.user as any, // Serialize user data for JSON storage
          },
          isActive: false, // Require activation in settings after connection
        },
        include: {
          platform: true,
          brand: true,
        },
      });
    } catch (error: any) {
      throw new Error(`OAuth callback failed: ${error.message}`);
    }
  }

  /**
   * Connect platform manually (for testing or direct token input)
   * NOTE: This should only be used for testing. Production connections must use OAuth.
   */
  async connectPlatform(brandId: string, platformId: string, data: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    platformUserId?: string;
    platformUsername?: string;
    profileUrl?: string;
    metadata?: any;
  }) {
    await this.ensurePlatformsExist();

    // Reject placeholder tokens - connections must use OAuth
    if (!data.accessToken ||
      data.accessToken === 'manual_placeholder_token' ||
      data.accessToken.includes('placeholder') ||
      data.accessToken.length < 20) {
      throw new Error(
        'Invalid access token. Platform connections must be established through OAuth. ' +
        'Please use the OAuth flow to connect your platform account.'
      );
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new Error(`Brand with ID "${brandId}" not found.`);
    }

    let platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      platform = await prisma.platform.findFirst({
        where: { name: { equals: platformId, mode: 'insensitive' } },
      });
    }

    if (!platform) {
      const availablePlatforms = await prisma.platform.findMany({
        select: { id: true, name: true },
      });
      throw new Error(
        `Platform with ID or name "${platformId}" not found. ` +
        `Available platforms: ${availablePlatforms.map(p => `${p.name} (${p.id})`).join(', ')}.`
      );
    }

    // Use upsert to handle both create and update
    // This prevents unique constraint violations
    const connectionData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.tokenExpiry,
      platformUserId: data.platformUserId,
      platformUsername: data.platformUsername,
      profileUrl: data.profileUrl,
      metadata: data.metadata,
      isActive: false, // Require activation in settings after connection
    };

    // First, try to find existing connection (active or inactive)
    const existing = await prisma.platformConnection.findFirst({
      where: {
        brandId,
        platformId: platform.id,
      },
    });

    if (existing) {
      // Update existing connection
      return prisma.platformConnection.update({
        where: { id: existing.id },
        data: connectionData,
        include: {
          platform: true,
        },
      });
    }

    // Create new connection if none exists
    return prisma.platformConnection.create({
      data: {
        id: nanoid(),
        brandId,
        platformId: platform.id,
        ...connectionData,
      },
      include: {
        platform: true,
      },
    });
  }

  async disconnectPlatform(connectionId: string) {
    return prisma.platformConnection.update({
      where: { id: connectionId },
      data: { isActive: false },
    });
  }

  async updateConnectionStatus(connectionId: string, isActive: boolean) {
    return prisma.platformConnection.update({
      where: { id: connectionId },
      data: { isActive },
      include: {
        platform: true,
        brand: true,
      },
    });
  }

  async getConnections(brandId: string) {
    return prisma.platformConnection.findMany({
      where: { brandId, isActive: true },
      include: {
        platform: true,
      },
    });
  }

  async getConnection(connectionId: string) {
    return prisma.platformConnection.findUnique({
      where: { id: connectionId },
      include: {
        platform: true,
        brand: true,
      },
    });
  }

  async updateTokens(connectionId: string, tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }) {
    return prisma.platformConnection.update({
      where: { id: connectionId },
      data: tokens,
    });
  }

  async getBrandConnections(workspaceId: string) {
    return prisma.platformConnection.findMany({
      where: {
        isActive: true,
        brand: {
          workspaceId,
          isActive: true,
        },
      },
      include: {
        platform: true,
        brand: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Refresh access token for a connection
   */
  async refreshConnectionToken(connectionId: string) {
    const connection = await this.getConnection(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const integration = getIntegration(connection.platform.name);
    if (!integration) {
      throw new Error(`Integration not found for platform: ${connection.platform.name}`);
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauthConfig = this.getOAuthConfig(connection.platform.name);
    const newTokens = await integration.refreshToken(
      connection.refreshToken,
      oauthConfig
    );

    return this.updateTokens(connectionId, {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken || connection.refreshToken,
      tokenExpiry: newTokens.tokenExpiry,
    });
  }

  /**
   * Sync account data from platform
   */
  async syncAccount(connectionId: string) {
    const connection = await this.getConnection(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const integration = getIntegration(connection.platform.name);
    if (!integration) {
      throw new Error(`Integration not found for platform: ${connection.platform.name}`);
    }

    const oauthConfig = this.getOAuthConfig(connection.platform.name);
    const user = await integration.getUserProfile(connection.accessToken, oauthConfig);

    // Update connection with latest user data
    return prisma.platformConnection.update({
      where: { id: connectionId },
      data: {
        platformUserId: user.id,
        platformUsername: user.username,
        profileUrl: user.profileUrl,
        metadata: {
          ...(connection.metadata as any || {}),
          user,
          syncedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Publish post to platform
   */
  async publishPost(
    connectionId: string,
    options: {
      content: string;
      mediaUrls?: string[];
      hashtags?: string[];
      mentions?: string[];
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    }
  ) {
    const connection = await this.getConnection(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    // Check if token needs refresh
    let currentConnection = connection;
    if (connection.tokenExpiry && new Date() >= connection.tokenExpiry) {
      await this.refreshConnectionToken(connectionId);
      // Reload connection with new token
      const refreshed = await this.getConnection(connectionId);
      if (refreshed) currentConnection = refreshed;
    }

    const integration = getIntegration(connection.platform.name);
    if (!integration) {
      throw new Error(`Integration not found for platform: ${connection.platform.name}`);
    }

    const oauthConfig = this.getOAuthConfig(currentConnection.platform.name);
    return integration.publishPost(currentConnection.accessToken, options, oauthConfig);
  }

  /**
   * Handle deauthorization callback from platform
   * Called when a user deauthorizes the app
   */
  async handleDeauthorize(platformUserId: string, platform: string) {
    try {
      // Find connection by platform user ID
      const connection = await prisma.platformConnection.findFirst({
        where: {
          platformUserId,
          platform: {
            name: { equals: platform, mode: 'insensitive' },
          },
          isActive: true,
        },
      });

      if (connection) {
        // Mark connection as inactive
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            isActive: false,
            metadata: {
              ...(connection.metadata as any || {}),
              deauthorizedAt: new Date().toISOString(),
              deauthorized: true,
            },
          },
        });

        return { success: true, connectionId: connection.id };
      }

      return { success: true, message: 'Connection not found or already deauthorized' };
    } catch (error: any) {
      console.error('Deauthorize error:', error);
      throw new Error(`Deauthorization failed: ${error.message}`);
    }
  }

  /**
   * Handle data deletion request from platform
   * Called when a user requests their data to be deleted
   */
  async handleDataDeletionRequest(platformUserId: string, platform: string) {
    try {
      // Find connection by platform user ID
      const connection = await prisma.platformConnection.findFirst({
        where: {
          platformUserId,
          platform: {
            name: { equals: platform, mode: 'insensitive' },
          },
        },
      });

      if (connection) {
        // Delete or anonymize user data
        // For GDPR compliance, we should delete personal data but keep connection record for audit
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            isActive: false,
            accessToken: '', // Clear tokens
            refreshToken: null,
            platformUsername: null,
            profileUrl: null,
            metadata: {
              dataDeletedAt: new Date().toISOString(),
              dataDeleted: true,
              // Keep minimal metadata for audit trail
            },
          },
        });

        // TODO: Delete any posts, comments, or other user-generated content associated with this connection
        // This would require additional queries based on your data model

        return {
          success: true,
          connectionId: connection.id,
          confirmationCode: `DELETION_${connection.id}_${Date.now()}`,
        };
      }

      return { success: true, message: 'No data found for this user' };
    } catch (error: any) {
      console.error('Data deletion error:', error);
      throw new Error(`Data deletion failed: ${error.message}`);
    }
  }
}

export const platformService = new PlatformService();
