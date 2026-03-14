import { prisma } from '../../config/database.js';
import { nanoid } from 'nanoid';
import type { CreateEventInput, UpdateEventInput } from './calendar.schema.js';

export class CalendarService {
  async create(workspaceId: string, userId: string, data: CreateEventInput) {
    return prisma.calendarEvent.create({
      data: {
        id: nanoid(),
        workspaceId,
        createdById: userId,
        ...data,
        startDate: new Date(data.startDate!),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        brand: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        post: { select: { id: true, content: true, status: true } },
      },
    });
  }

  async getEvents(workspaceId: string, filters: {
    startDate: Date;
    endDate: Date;
    brandId?: string;
    clientId?: string;
    type?: string;
    includeScheduledPosts?: boolean;
  }) {
    const where: any = {
      workspaceId,
      startDate: { gte: filters.startDate, lte: filters.endDate },
    };

    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.type) where.type = filters.type;

    // Get calendar events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        post: { select: { id: true, content: true, status: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // Also get scheduled posts as events (if includeScheduledPosts is true or undefined)
    let postEvents: any[] = [];
    if (filters.includeScheduledPosts !== false) {
      const postWhere: any = {
        workspaceId,
        scheduledAt: { gte: filters.startDate, lte: filters.endDate },
      };
      if (filters.brandId) postWhere.brandId = filters.brandId;

      const posts = await prisma.post.findMany({
        where: postWhere,
        include: {
          brand: { select: { id: true, name: true } },
        },
      });

      postEvents = posts.map((post) => ({
      id: `post-${post.id}`,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      description: post.content,
      type: 'POST' as const,
      startDate: post.scheduledAt,
      endDate: null,
      allDay: false,
      brandId: post.brandId,
      clientId: null,
      postId: post.id,
      color: '#DC143C',
      brand: post.brand,
      client: null,
      post: { id: post.id, content: post.content, status: post.status },
      workspaceId,
      createdById: post.createdById,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      }));
    }

    return [...events, ...postEvents].sort(
      (a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
    );
  }

  async getById(id: string, workspaceId: string) {
    return prisma.calendarEvent.findFirst({
      where: { id, workspaceId },
      include: {
        brand: true,
        client: true,
        post: true,
      },
    });
  }

  async update(id: string, data: UpdateEventInput) {
    return prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        brand: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        post: { select: { id: true, content: true, status: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.calendarEvent.delete({ where: { id } });
  }
}

export const calendarService = new CalendarService();

