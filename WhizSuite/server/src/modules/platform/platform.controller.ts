import { Response, NextFunction } from 'express';
import { platformService } from './platform.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound } from '../../shared/utils/response.js';

export async function getAllPlatforms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const platforms = await platformService.getAllPlatforms();
    sendSuccess(res, platforms);
  } catch (error) {
    next(error);
  }
}

export async function getConnections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connections = await platformService.getBrandConnections(req.workspace!.id);
    sendSuccess(res, connections);
  } catch (error) {
    next(error);
  }
}

export async function getBrandConnections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connections = await platformService.getConnections(req.params.brandId);
    sendSuccess(res, connections);
  } catch (error) {
    next(error);
  }
}

export async function connect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connection = await platformService.connectPlatform(
      req.params.brandId,
      req.body.platformId,
      req.body
    );
    sendSuccess(res, connection, 201);
  } catch (error) {
    next(error);
  }
}

export async function disconnect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connectionId = req.params.connectionId || req.params.accountId;
    const connection = await platformService.getConnection(connectionId);
    if (!connection) {
      return sendNotFound(res, 'Connection');
    }
    await platformService.disconnectPlatform(connectionId);
    sendSuccess(res, { message: 'Platform disconnected successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateConnectionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connectionId = req.params.connectionId || req.params.accountId;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value',
      });
    }

    const connection = await platformService.getConnection(connectionId);
    if (!connection) {
      return sendNotFound(res, 'Connection');
    }

    const updated = await platformService.updateConnectionStatus(connectionId, isActive);
    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

export async function getAuthUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { platform, brandId } = req.query;
    if (!platform || !brandId) {
      return res.status(400).json({
        success: false,
        error: 'Platform and brandId are required',
      });
    }
    const authUrl = await platformService.getAuthUrl(
      platform as string,
      brandId as string,
      req.user!.id
    );
    sendSuccess(res, { authUrl });
  } catch (error: any) {
    // Provide helpful error messages for common issues
    let errorMessage = error.message;
    
    if (error.message?.includes('App ID') || error.message?.includes('app ID')) {
      errorMessage = `${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure FACEBOOK_APP_ID is set in your .env file\n` +
        `2. For Instagram Business, use Facebook App ID (not Instagram App ID)\n` +
        `3. Verify the App ID in Meta Portal matches your .env file\n` +
        `4. Check META_PORTAL_SETUP_CHECKLIST.md for complete setup guide`;
    }
    
    if (error.message) {
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
    next(error);
  }
}

export async function oauthCallback(req: any, res: Response, next: NextFunction) {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Code and state are required',
      });
    }
    const connection = await platformService.handleOAuthCallback(code as string, state as string);
    // Redirect to platform settings page with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const platformName = connection.platform.name.toLowerCase();
    res.redirect(`${frontendUrl}/brands/${connection.brandId}/platforms/${platformName}?connected=true&inactive=true`);
  } catch (error: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/platforms/error?error=${encodeURIComponent(error.message || 'OAuth failed')}`);
  }
}

export async function syncAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const connectionId = req.params.accountId || req.params.connectionId;
    const connection = await platformService.getConnection(connectionId);
    if (!connection) {
      return sendNotFound(res, 'Connection');
    }
    const result = await platformService.syncAccount(connectionId);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Handle deauthorize callback from platform
 * Public endpoint - called by platform when user deauthorizes app
 */
export async function deauthorizeCallback(req: any, res: Response, next: NextFunction) {
  try {
    // Instagram/Facebook sends signed_request or user_id in the request
    const signedRequest = req.body.signed_request || req.query.signed_request;
    const userId = req.body.user_id || req.query.user_id;
    const platform = req.params.platform || 'instagram';

    // For Instagram/Facebook, we need to verify the signed_request
    // For now, we'll accept the user_id directly (in production, verify signed_request)
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await platformService.handleDeauthorize(userId, platform);
    
    // Return 200 OK as per platform requirements
    return res.status(200).json({
      success: true,
      message: 'Deauthorization processed successfully',
    });
  } catch (error: any) {
    console.error('Deauthorize callback error:', error);
    // Still return 200 to prevent platform retries
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle data deletion request from platform
 * Public endpoint - called by platform when user requests data deletion
 */
export async function dataDeletionCallback(req: any, res: Response, next: NextFunction) {
  try {
    const signedRequest = req.body.signed_request || req.query.signed_request;
    const userId = req.body.user_id || req.query.user_id;
    const platform = req.params.platform || 'instagram';

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await platformService.handleDataDeletionRequest(userId, platform);
    
    // Return confirmation code as per platform requirements
    return res.status(200).json({
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy/data-deletion`,
      confirmation_code: result.confirmationCode || `DELETION_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Data deletion callback error:', error);
    // Still return 200 with error message
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Webhook handler for Instagram/Meta platforms
 * Handles both verification (GET) and events (POST)
 */
export async function webhookHandler(req: any, res: Response, next: NextFunction) {
  try {
    const { platform } = req.params;
    const integration = await import('./integrations').then(m => m.getIntegration(platform));

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: `Integration not found for platform: ${platform}`,
      });
    }

    // Get webhook config
    const { config } = await import('../../config');
    const oauthConfig = {
      clientId: config.oauth.facebook.appId || config.oauth.instagram.appId,
      clientSecret: config.oauth.facebook.appSecret || config.oauth.instagram.appSecret,
      redirectUri: '',
      scopes: [],
      verifyToken: config.oauth.instagram.verifyToken,
      apiVersion: config.oauth.instagram.apiVersion,
    };

    // Verify webhook (for GET requests, this returns the challenge)
    const verification = integration.verifyWebhook(req, oauthConfig);

    // GET request = webhook verification
    if (req.method === 'GET') {
      if (verification && typeof verification === 'string') {
        return res.status(200).send(verification);
      }
      return res.status(403).send('Verification failed');
    }

    // POST request = webhook event
    if (req.method === 'POST') {
      if (!verification) {
        return res.status(403).json({
          success: false,
          error: 'Webhook verification failed',
        });
      }

      // Process webhook event
      // We need to find which connection this event belongs to
      // Instagram webhooks include the page/account ID in the entry
      const event = req.body;
      
      if (event.entry && event.entry.length > 0) {
        // Try to find connection by platform user ID
        // This is a simplified approach - in production, you'd want to store
        // webhook subscriptions and map them to connections
        const entry = event.entry[0];
        
        // For Instagram, we might need to look up by page ID or account ID
        // For now, we'll process all active Instagram connections
        // In production, you should store webhook subscription mappings
        const connections = await platformService.getBrandConnections(
          req.workspace?.id || ''
        );

        const instagramConnections = connections.filter(
          (conn) => conn.platform.name.toLowerCase() === 'instagram' && conn.isActive
        );

        // Process webhook for each Instagram connection
        // In production, you'd match the entry ID to the specific connection
        for (const connection of instagramConnections) {
          try {
            await integration.processWebhook(event, connection.id);
          } catch (error) {
            console.error(`Error processing webhook for connection ${connection.id}:`, error);
          }
        }
      }

      // Always return 200 to acknowledge receipt
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    // Still return 200 to prevent retries for processing errors
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
}

