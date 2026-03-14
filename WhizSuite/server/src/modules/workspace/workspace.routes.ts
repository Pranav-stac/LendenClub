import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission, requireOwner } from '../../shared/middleware/workspace.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  create,
  getMyWorkspaces,
  getById,
  update,
  remove,
  getMembers,
  getCurrentMember,
  getRoles,
  getRoleById,
  updateMemberRole,
  removeMember,
  getInvitations,
  createInvitation,
  cancelInvitation,
  getInvitationByToken,
  acceptInvitation,
  acceptInvitationWithRegistration,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
} from './workspace.controller.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  createRoleSchema,
  updateRoleSchema,
  acceptInvitationWithRegistrationSchema,
} from './workspace.schema.js';

const router = Router();

// Public invitation routes (no auth required) - MUST come before authenticate middleware
router.get('/invitations/public/:token', getInvitationByToken);
router.post('/invitations/public/:token/accept', validateBody(acceptInvitationWithRegistrationSchema), acceptInvitationWithRegistration);

// All routes require authentication
router.use(authenticate);

// Workspace CRUD - support both /my and / for listing
router.post('/', validateBody(createWorkspaceSchema), create);
router.get('/', getMyWorkspaces);
router.get('/my', getMyWorkspaces);

// Current workspace (uses x-workspace-id header) - MUST come before /:id
router.get('/current', loadWorkspace, getById);
router.put('/current', loadWorkspace, requireOwner, validateBody(updateWorkspaceSchema), update);
router.delete('/current', loadWorkspace, requireOwner, remove);

// Team management (uses x-workspace-id header) - MUST come before /:id
router.get('/members/me', loadWorkspace, getCurrentMember);
router.get('/members', loadWorkspace, getMembers);
router.post('/members/invite', loadWorkspace, requirePermission('team:invite'), validateBody(inviteMemberSchema), createInvitation);
router.put('/members/:memberId/role', loadWorkspace, requirePermission('team:manage'), validateBody(updateMemberRoleSchema), updateMemberRole);
router.delete('/members/:memberId', loadWorkspace, requirePermission('team:manage'), removeMember);

// Roles - MUST come before /:id
router.get('/roles', loadWorkspace, getRoles);
router.get('/roles/:roleId', loadWorkspace, getRoleById);
router.post('/roles', loadWorkspace, requirePermission('roles:create'), validateBody(createRoleSchema), createRole);
router.put('/roles/:roleId', loadWorkspace, requirePermission('roles:edit'), validateBody(updateRoleSchema), updateRole);
router.delete('/roles/:roleId', loadWorkspace, requirePermission('roles:delete'), deleteRole);
router.get('/permissions', loadWorkspace, requirePermission('roles:view'), getPermissions);

// Invitations - MUST come before /:id
router.get('/invitations', loadWorkspace, requirePermission('team:manage'), getInvitations);
router.delete('/invitations/:invitationId', loadWorkspace, requirePermission('team:manage'), cancelInvitation);
router.post('/invitations/:token/accept', acceptInvitation);

// Get specific workspace by ID - MUST come LAST (after all specific routes)
router.get('/:id', getById);

// Also support path-based workspace routes
router.patch('/:workspaceId', loadWorkspace, requireOwner, validateBody(updateWorkspaceSchema), update);
router.delete('/:workspaceId', loadWorkspace, requireOwner, remove);
router.get('/:workspaceId/members', loadWorkspace, getMembers);
router.get('/:workspaceId/roles', loadWorkspace, getRoles);
router.patch('/:workspaceId/members/:memberId/role', loadWorkspace, requirePermission('team:manage'), validateBody(updateMemberRoleSchema), updateMemberRole);
router.delete('/:workspaceId/members/:memberId', loadWorkspace, requirePermission('team:manage'), removeMember);
router.get('/:workspaceId/invitations', loadWorkspace, requirePermission('team:manage'), getInvitations);
router.post('/:workspaceId/invitations', loadWorkspace, requirePermission('team:invite'), validateBody(inviteMemberSchema), createInvitation);
router.delete('/:workspaceId/invitations/:invitationId', loadWorkspace, requirePermission('team:manage'), cancelInvitation);

export { router as workspaceRoutes };
