import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { sendForbidden, sendNotFound } from '../utils/response.js';

export async function loadWorkspace(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId || req.headers['x-workspace-id'] as string;

    if (!workspaceId) {
      return sendForbidden(res, 'Workspace ID required');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return sendNotFound(res, 'Workspace');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: req.user!.id,
        isActive: true,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return sendForbidden(res, 'Not a member of this workspace');
    }

    req.workspace = {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
    };

    req.member = {
      id: member.id,
      roleId: member.roleId,
      permissions: member.role.permissions.map((rp) => rp.permission.code),
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.member) {
      return sendForbidden(res, 'Member context required');
    }

    // Workspace owners always have all permissions
    if (req.workspace && req.user && req.workspace.ownerId === req.user.id) {
      return next();
    }

    const hasPermission = requiredPermissions.some((perm) => {
      const userPermissions = req.member!.permissions;
      
      // Check exact match first
      if (userPermissions.includes(perm)) {
        return true;
      }
      
      // Support both singular and plural forms for compatibility
      // e.g., clients:create matches client:create, posts:view matches post:view
      // Convert plural to singular (clients:create -> client:create)
      const singularForm = perm.replace(/s:/, ':');
      if (userPermissions.includes(singularForm)) {
        return true;
      }
      
      // Convert singular to plural (client:create -> clients:create)
      const pluralForm = perm.replace(/([^s]):/, '$1s:');
      if (userPermissions.includes(pluralForm)) {
        return true;
      }
      
      return false;
    });

    if (!hasPermission) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.workspace || !req.user) {
    return sendForbidden(res);
  }

  if (req.workspace.ownerId !== req.user.id) {
    return sendForbidden(res, 'Owner access required');
  }

  next();
}


