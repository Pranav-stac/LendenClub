import { Response, NextFunction } from 'express';
import { calendarService } from './calendar.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound } from '../../shared/utils/response.js';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const event = await calendarService.create(req.workspace!.id, req.user!.id, req.body);
    sendSuccess(res, event, 201);
  } catch (error) {
    next(error);
  }
}

export async function getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Support both startDate/endDate and start/end (Postman uses both)
    const startDate = (req.query.startDate || req.query.start) as string;
    const endDate = (req.query.endDate || req.query.end) as string;
    const { brandId, clientId, type, includeScheduledPosts } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate (or start and end) are required',
      });
    }
    
    const events = await calendarService.getEvents(req.workspace!.id, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      brandId: brandId as string,
      clientId: clientId as string,
      type: type as string,
      includeScheduledPosts: includeScheduledPosts === 'true',
    });
    sendSuccess(res, events);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const event = await calendarService.getById(req.params.id, req.workspace!.id);
    if (!event) {
      return sendNotFound(res, 'Event');
    }
    sendSuccess(res, event);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await calendarService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Event');
    }
    const event = await calendarService.update(req.params.id, req.body);
    sendSuccess(res, event);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await calendarService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Event');
    }
    await calendarService.delete(req.params.id);
    sendSuccess(res, { message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}

