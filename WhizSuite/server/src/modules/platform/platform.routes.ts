import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';
import {
  getAllPlatforms,
  getConnections,
  getBrandConnections,
  connect,
  disconnect,
  updateConnectionStatus,
  getAuthUrl,
  oauthCallback,
  syncAccount,
  webhookHandler,
  deauthorizeCallback,
  dataDeletionCallback,
} from './platform.controller.js';

const router = Router();

// Public webhook endpoint (no auth required - uses signature verification)
router.get('/webhook/:platform', webhookHandler);
router.post('/webhook/:platform', webhookHandler);

// Public OAuth callback (no auth required)
router.get('/callback', oauthCallback);

// Public deauthorize callback (no auth required - called by platform)
router.post('/deauthorize/:platform', deauthorizeCallback);
router.get('/deauthorize/:platform', deauthorizeCallback);

// Public data deletion callback (no auth required - called by platform)
router.post('/data-deletion/:platform', dataDeletionCallback);
router.get('/data-deletion/:platform', dataDeletionCallback);

router.use(authenticate);

// Get all available/supported platforms
router.get('/supported', getAllPlatforms);
router.get('/available', getAllPlatforms);

// OAuth flow
router.get('/auth-url', getAuthUrl);

// Routes that need workspace context
router.use(loadWorkspace);

// Get all connections for workspace
router.get('/connections', requirePermission('platforms:view'), getConnections);
router.get('/accounts', requirePermission('platforms:view'), getConnections);

// Brand-specific connections
router.get('/brands/:brandId/connections', requirePermission('platforms:view'), getBrandConnections);
router.post('/brands/:brandId/connect', requirePermission('platforms:connect'), connect);
router.post('/accounts/:accountId/disconnect', requirePermission('platforms:connect'), disconnect);
router.post('/accounts/:accountId/sync', requirePermission('platforms:view'), syncAccount);
router.put('/accounts/:accountId/status', requirePermission('platforms:connect'), updateConnectionStatus);
router.put('/connections/:connectionId/status', requirePermission('platforms:connect'), updateConnectionStatus);
router.delete('/connections/:connectionId', requirePermission('platforms:connect'), disconnect);

export { router as platformRoutes };
