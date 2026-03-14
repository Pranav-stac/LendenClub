import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import type { CreateClientInput, UpdateClientInput } from './client.schema.js';

export class ClientService {
  async create(workspaceId: string, data: CreateClientInput) {
    return prisma.client.create({
      data: {
        id: nanoid(),
        workspaceId,
        ...data,
      },
    });
  }

  async getAll(workspaceId: string) {
    return prisma.client.findMany({
      where: { workspaceId, isActive: true },
      include: {
        _count: {
          select: { brands: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, workspaceId: string) {
    return prisma.client.findFirst({
      where: { id, workspaceId },
      include: {
        brands: {
          where: { isActive: true },
        },
      },
    });
  }

  async update(id: string, workspaceId: string, data: UpdateClientInput) {
    return prisma.client.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async grantAccess(clientId: string, memberId: string) {
    return prisma.clientMemberAccess.create({
      data: {
        id: nanoid(),
        clientId,
        memberId,
      },
    });
  }

  async revokeAccess(clientId: string, memberId: string) {
    return prisma.clientMemberAccess.delete({
      where: {
        clientId_memberId: {
          clientId,
          memberId,
        },
      },
    });
  }
}

export const clientService = new ClientService();

