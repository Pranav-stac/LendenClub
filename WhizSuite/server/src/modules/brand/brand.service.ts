import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import type { CreateBrandInput, UpdateBrandInput } from './brand.schema.js';

export class BrandService {
  async create(workspaceId: string, data: CreateBrandInput) {
    return prisma.brand.create({
      data: {
        id: nanoid(),
        workspaceId,
        ...data,
      },
    });
  }

  async getAll(workspaceId: string, clientId?: string) {
    const brands = await prisma.brand.findMany({
      where: {
        workspaceId,
        isActive: true,
        ...(clientId && { clientId }),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        platformConnections: {
          where: { isActive: true },
          include: {
            platform: true,
          },
        },
        _count: {
          select: { posts: true, platformConnections: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform platformConnections to platforms with isConnected field
    return brands.map(brand => ({
      ...brand,
      platforms: brand.platformConnections.map(pc => ({
        id: pc.id,
        platformId: pc.platformId,
        platform: pc.platform,
        isConnected: pc.isActive, // Map isActive to isConnected for frontend
        accessToken: pc.accessToken,
        refreshToken: pc.refreshToken,
        tokenExpiry: pc.tokenExpiry,
        platformUserId: pc.platformUserId,
        platformUsername: pc.platformUsername,
        profileUrl: pc.profileUrl,
        metadata: pc.metadata,
        createdAt: pc.createdAt,
        updatedAt: pc.updatedAt,
      })),
    }));
  }

  async getById(id: string, workspaceId: string) {
    const brand = await prisma.brand.findFirst({
      where: { id, workspaceId },
      include: {
        client: true,
        platformConnections: {
          // Return all connections (active and inactive) so frontend can show status
          include: {
            platform: true,
          },
        },
      },
    });

    if (!brand) {
      return null;
    }

    // Transform platformConnections to platforms with isConnected field
    // This matches what the frontend expects
    return {
      ...brand,
      platforms: brand.platformConnections.map(pc => ({
        id: pc.id,
        platformId: pc.platformId,
        platform: pc.platform,
        isConnected: pc.isActive, // Map isActive to isConnected for frontend
        accessToken: pc.accessToken,
        refreshToken: pc.refreshToken,
        tokenExpiry: pc.tokenExpiry,
        platformUserId: pc.platformUserId,
        platformUsername: pc.platformUsername,
        profileUrl: pc.profileUrl,
        metadata: pc.metadata,
        createdAt: pc.createdAt,
        updatedAt: pc.updatedAt,
      })),
    };
  }

  async update(id: string, data: UpdateBrandInput) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brand.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async grantAccess(brandId: string, memberId: string) {
    return prisma.brandMemberAccess.create({
      data: {
        id: nanoid(),
        brandId,
        memberId,
      },
    });
  }

  async revokeAccess(brandId: string, memberId: string) {
    return prisma.brandMemberAccess.delete({
      where: {
        brandId_memberId: {
          brandId,
          memberId,
        },
      },
    });
  }
}

export const brandService = new BrandService();

