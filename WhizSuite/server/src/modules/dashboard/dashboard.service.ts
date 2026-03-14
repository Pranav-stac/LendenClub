import { prisma } from '../../config/database.js';

export class DashboardService {
  async getStats(workspaceId: string) {
    const [
      totalPosts,
      scheduledPosts,
      publishedPosts,
      draftPosts,
      totalClients,
      totalBrands,
      teamMembers,
      totalMedia,
    ] = await Promise.all([
      prisma.post.count({ where: { workspaceId } }),
      prisma.post.count({ where: { workspaceId, status: 'SCHEDULED' } }),
      prisma.post.count({ where: { workspaceId, status: 'PUBLISHED' } }),
      prisma.post.count({ where: { workspaceId, status: 'DRAFT' } }),
      prisma.client.count({ where: { workspaceId, isActive: true } }),
      prisma.brand.count({ where: { workspaceId, isActive: true } }),
      prisma.workspaceMember.count({ where: { workspaceId, isActive: true } }),
      prisma.mediaFile.count({ where: { workspaceId } }),
    ]);

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        brand: {
          select: { id: true, name: true },
        },
      },
    });

    // Get upcoming scheduled posts
    const upcomingPosts = await prisma.post.findMany({
      where: {
        workspaceId,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true,
        content: true,
        scheduledAt: true,
        brand: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      totalPosts,
      scheduledPosts,
      publishedPosts,
      draftPosts,
      totalClients,
      totalBrands,
      teamMembers,
      totalMedia,
      recentPosts,
      upcomingPosts,
    };
  }
}

export const dashboardService = new DashboardService();
