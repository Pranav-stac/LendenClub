import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function sendNotFound(res: Response, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
  });
}

export function sendUnauthorized(res: Response, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

export function sendForbidden(res: Response, message = 'Access denied') {
  return res.status(403).json({
    success: false,
    error: message,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}






