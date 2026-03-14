import { prisma } from '../../config/database.js';
import { generateSlug } from '../../shared/utils/slug.js';
import { nanoid } from 'nanoid';
import { hashPassword } from '../../shared/utils/password.js';

export class WorkspaceService {
  async create(userId: string, data: { name: string; description?: string }) {
    const slug = generateSlug(data.name);

    // Create workspace with default roles
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          id: nanoid(),
          name: data.name,
          slug,
          description: data.description,
          ownerId: userId,
        },
      });

      // Create default roles
      const roles = [
        { name: 'Owner', description: 'Full access to workspace', isSystem: true },
        { name: 'Admin', description: 'Administrative access', isSystem: true },
        { name: 'Manager', description: 'Manage content and team', isSystem: true },
        { name: 'Content Creator', description: 'Create and edit content', isSystem: true },
        { name: 'Analyst', description: 'View analytics and reports', isSystem: true },
        { name: 'Client', description: 'Limited client access', isSystem: true },
      ];

      const createdRoles = await Promise.all(
        roles.map((role) =>
          tx.role.create({
            data: {
              id: nanoid(),
              workspaceId: ws.id,
              ...role,
            },
          })
        )
      );

      // Get all permissions
      const permissions = await tx.permission.findMany();

      // Assign permissions based on role
      const ownerRole = createdRoles.find((r) => r.name === 'Owner')!;
      const adminRole = createdRoles.find((r) => r.name === 'Admin')!;
      const managerRole = createdRoles.find((r) => r.name === 'Manager')!;
      const creatorRole = createdRoles.find((r) => r.name === 'Content Creator')!;
      const analystRole = createdRoles.find((r) => r.name === 'Analyst')!;
      const clientRole = createdRoles.find((r) => r.name === 'Client')!;

      // Owner and Admin get all permissions
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          id: nanoid(),
          roleId: ownerRole.id,
          permissionId: p.id,
        })),
      });

      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          id: nanoid(),
          roleId: adminRole.id,
          permissionId: p.id,
        })),
      });

      // Manager permissions
      const managerPermissions = permissions.filter((p) =>
        ['posts', 'clients', 'brands', 'calendar', 'reviews', 'analytics'].some((cat) =>
          p.category === cat
        )
      );
      await tx.rolePermission.createMany({
        data: managerPermissions.map((p) => ({
          id: nanoid(),
          roleId: managerRole.id,
          permissionId: p.id,
        })),
      });

      // Content Creator permissions
      const creatorPermissions = permissions.filter((p) =>
        p.code.includes('post') || p.code.includes('media') || p.code.includes('calendar:view')
      );
      await tx.rolePermission.createMany({
        data: creatorPermissions.map((p) => ({
          id: nanoid(),
          roleId: creatorRole.id,
          permissionId: p.id,
        })),
      });

      // Analyst permissions
      const analystPermissions = permissions.filter((p) => p.code.includes('view'));
      await tx.rolePermission.createMany({
        data: analystPermissions.map((p) => ({
          id: nanoid(),
          roleId: analystRole.id,
          permissionId: p.id,
        })),
      });

      // Client permissions
      const clientPermissions = permissions.filter((p) =>
        p.code === 'posts:view' || p.code === 'reviews:view' || p.code === 'reviews:approve'
      );
      await tx.rolePermission.createMany({
        data: clientPermissions.map((p) => ({
          id: nanoid(),
          roleId: clientRole.id,
          permissionId: p.id,
        })),
      });

      // Add owner as member
      await tx.workspaceMember.create({
        data: {
          id: nanoid(),
          workspaceId: ws.id,
          userId,
          roleId: ownerRole.id,
        },
      });

      return ws;
    });

    return workspace;
  }

  async getMyWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId, isActive: true },
      include: { workspace: true },
    });

    return memberships.map((m) => m.workspace);
  }

  async getById(id: string) {
    return prisma.workspace.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; description?: string; logoUrl?: string }) {
    return prisma.workspace.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.workspace.delete({ where: { id } });
  }

  // Team Management
  async getCurrentMember(workspaceId: string, userId: string) {
    // Get workspace to check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const isOwner = workspace.ownerId === userId;

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
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
      throw new Error('Member not found');
    }

    // If user is owner, they have all permissions - get all permission codes
    let permissions: string[] = [];
    if (isOwner) {
      const allPermissions = await prisma.permission.findMany({
        select: { code: true },
      });
      permissions = allPermissions.map((p) => p.code);
    } else {
      permissions = member.role.permissions.map((rp) => rp.permission.code);
    }

    return {
      id: member.id,
      roleId: member.roleId,
      role: {
        id: member.role.id,
        name: member.role.name,
        description: member.role.description,
      },
      permissions,
      isOwner,
      user: member.user,
    };
  }

  async getMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getRoles(workspaceId: string) {
    return prisma.role.findMany({
      where: { workspaceId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateMemberRole(memberId: string, roleId: string) {
    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        role: true,
      },
    });
  }

  async removeMember(memberId: string) {
    return prisma.workspaceMember.delete({ where: { id: memberId } });
  }

  // Invitations
  async getInvitations(workspaceId: string) {
    const invitations = await prisma.invitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get roles for invitations
    const roleIds = [...new Set(invitations.map(i => i.roleId))];
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    const roleMap = new Map(roles.map(r => [r.id, r]));
    
    return invitations.map(inv => ({
      ...inv,
      role: roleMap.get(inv.roleId),
      status: inv.acceptedAt ? 'ACCEPTED' : 'PENDING',
    }));
  }

  async createInvitation(workspaceId: string, invitedBy: string, email: string, roleId: string) {
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.invitation.create({
      data: {
        id: nanoid(),
        workspaceId,
        email,
        roleId,
        token,
        expiresAt,
      },
    });
    
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    
    return { ...invitation, role, status: 'PENDING' };
  }

  async cancelInvitation(invitationId: string) {
    return prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  async getInvitationByToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        role: true,
      },
    });

    if (!invitation) throw new Error('Invalid invitation token');
    if (invitation.acceptedAt) throw new Error('Invitation already accepted');
    if (new Date(invitation.expiresAt) < new Date()) throw new Error('Invitation has expired');

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new Error('Invalid invitation');
    if (invitation.acceptedAt) throw new Error('Invitation already used');
    if (new Date(invitation.expiresAt) < new Date()) throw new Error('Invitation expired');

    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          id: nanoid(),
          workspaceId: invitation.workspaceId,
          userId,
          roleId: invitation.roleId,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return invitation;
  }

  async acceptInvitationWithRegistration(token: string, data: { password: string; firstName: string; lastName: string }) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) throw new Error('Invalid invitation token');
    if (invitation.acceptedAt) throw new Error('Invitation already accepted');
    if (new Date(invitation.expiresAt) < new Date()) throw new Error('Invitation has expired');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists. Please login and accept the invitation.');
    }

    const passwordHash = await hashPassword(data.password);

    // Create user and accept invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: nanoid(),
          email: invitation.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      await tx.workspaceMember.create({
        data: {
          id: nanoid(),
          workspaceId: invitation.workspaceId,
          userId: user.id,
          roleId: invitation.roleId,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    return result;
  }

  // Role Management
  async createRole(workspaceId: string, data: { name: string; description?: string; permissionIds?: string[] }) {
    const role = await prisma.role.create({
      data: {
        id: nanoid(),
        workspaceId,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });

    // Assign permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          id: nanoid(),
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return this.getRoleWithPermissions(role.id);
  }

  async updateRole(roleId: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    // Check if role exists
    const existing = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existing) {
      throw new Error('Role not found');
    }

    // Update role
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Update permissions if provided
    if (data.permissionIds !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({ where: { roleId } });

      // Add new permissions
      if (data.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            id: nanoid(),
            roleId,
            permissionId,
          })),
        });
      }
    }

    return this.getRoleWithPermissions(roleId);
  }

  async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is in use
    const members = await prisma.workspaceMember.findFirst({
      where: { roleId },
    });
    if (members) {
      throw new Error('Cannot delete role that is assigned to members');
    }

    return prisma.role.delete({ where: { id: roleId } });
  }

  async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getRoleById(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  private async getRoleWithPermissions(roleId: string) {
    return this.getRoleById(roleId);
  }
}

export const workspaceService = new WorkspaceService();
