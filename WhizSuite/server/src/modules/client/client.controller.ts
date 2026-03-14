import { Response, NextFunction } from 'express';
import { clientService } from './client.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound } from '../../shared/utils/response.js';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const client = await clientService.create(req.workspace!.id, req.body);
    sendSuccess(res, client, 201);
  } catch (error) {
    next(error);
  }
}

export async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clients = await clientService.getAll(req.workspace!.id);
    sendSuccess(res, clients);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const client = await clientService.getById(req.params.id, req.workspace!.id);
    if (!client) {
      return sendNotFound(res, 'Client');
    }
    sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await clientService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Client');
    }
    const client = await clientService.update(req.params.id, req.workspace!.id, req.body);
    sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await clientService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Client');
    }
    await clientService.delete(req.params.id);
    sendSuccess(res, { message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function grantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await clientService.getById(req.params.clientId, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Client');
    }
    await clientService.grantAccess(req.params.clientId, req.params.memberId);
    sendSuccess(res, { message: 'Access granted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function revokeAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await clientService.revokeAccess(req.params.clientId, req.params.memberId);
    sendSuccess(res, { message: 'Access revoked successfully' });
  } catch (error) {
    next(error);
  }
}

