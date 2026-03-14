import { Response, NextFunction, Request } from 'express';
import { workspaceService } from './workspace.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendError, sendNotFound } from '../../shared/utils/response.js';
import { config } from '../../config/index.js';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt.js';
import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspace = await workspaceService.create(req.user!.id, req.body);
    sendSuccess(res, workspace, 201);
  } catch (error) {
    next(error);
  }
}

export async function getMyWorkspaces(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaces = await workspaceService.getMyWorkspaces(req.user!.id);
    sendSuccess(res, workspaces);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Support both workspace context and path param
    const workspaceId = req.workspace?.id || req.params.id;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const workspace = await workspaceService.getById(workspaceId);
    if (!workspace) {
      return sendNotFound(res, 'Workspace');
    }
    sendSuccess(res, workspace);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const workspace = await workspaceService.getById(workspaceId);
    if (!workspace) {
      return sendNotFound(res, 'Workspace');
    }
    const updated = await workspaceService.update(workspaceId, req.body);
    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const workspace = await workspaceService.getById(workspaceId);
    if (!workspace) {
      return sendNotFound(res, 'Workspace');
    }
    await workspaceService.delete(workspaceId);
    sendSuccess(res, { message: 'Workspace deleted successfully' });
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
}

// Team Management
export async function getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const members = await workspaceService.getMembers(workspaceId);
    sendSuccess(res, members);
  } catch (error) {
    next(error);
  }
}

export async function getCurrentMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.headers['x-workspace-id'] as string;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    
    const member = await workspaceService.getCurrentMember(workspaceId, req.user!.id);
    sendSuccess(res, member);
  } catch (error) {
    next(error);
  }
}

export async function getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const roles = await workspaceService.getRoles(workspaceId);
    sendSuccess(res, roles);
  } catch (error) {
    next(error);
  }
}

export async function getRoleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const role = await workspaceService.getRoleById(req.params.roleId);
    if (!role) {
      return sendNotFound(res, 'Role');
    }
    sendSuccess(res, role);
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const member = await workspaceService.updateMemberRole(req.params.memberId, req.body.roleId);
    sendSuccess(res, member);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Member');
    }
    next(error);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await workspaceService.removeMember(req.params.memberId);
    sendSuccess(res, { message: 'Member removed successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Member');
    }
    next(error);
  }
}

// Invitations
export async function getInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const invitations = await workspaceService.getInvitations(workspaceId);
    sendSuccess(res, invitations);
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const invitation = await workspaceService.createInvitation(
      workspaceId,
      req.user!.id,
      req.body.email,
      req.body.roleId
    );
    
    // Generate shareable link
    const inviteLink = `${config.frontend.url}/invite/${invitation.token}`;
    
    // Return invitation token and shareable link
    sendSuccess(res, { ...invitation, invitationToken: invitation.token, inviteLink }, 201);
  } catch (error) {
    next(error);
  }
}

export async function cancelInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await workspaceService.cancelInvitation(req.params.invitationId);
    sendSuccess(res, { message: 'Invitation cancelled' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Invitation');
    }
    next(error);
  }
}

export async function getInvitationByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const invitation = await workspaceService.getInvitationByToken(req.params.token);
    sendSuccess(res, invitation);
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await workspaceService.acceptInvitation(req.params.token, req.user!.id);
    const workspace = await workspaceService.getById(result.workspaceId);
    sendSuccess(res, workspace);
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

export async function acceptInvitationWithRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await workspaceService.acceptInvitationWithRegistration(
      req.params.token,
      req.body
    );
    
    // Generate tokens for the new user
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await prisma.refreshToken.create({
      data: {
        id: nanoid(),
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });
    
    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    }, 201);
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

// Role Management
export async function createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.workspace?.id || req.params.workspaceId;
    if (!workspaceId) {
      return sendError(res, 'Workspace ID required', 400);
    }
    const role = await workspaceService.createRole(workspaceId, req.body);
    sendSuccess(res, role, 201);
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
}

export async function updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const role = await workspaceService.updateRole(req.params.roleId, req.body);
    sendSuccess(res, role);
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Role');
    }
    next(error);
  }
}

export async function deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await workspaceService.deleteRole(req.params.roleId);
    sendSuccess(res, { message: 'Role deleted successfully' });
  } catch (error: any) {
    if (error.message) {
      return sendError(res, error.message, 400);
    }
    if (error.code === 'P2025') {
      return sendNotFound(res, 'Role');
    }
    next(error);
  }
}

export async function getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const permissions = await workspaceService.getPermissions();
    sendSuccess(res, permissions);
  } catch (error) {
    next(error);
  }
}
