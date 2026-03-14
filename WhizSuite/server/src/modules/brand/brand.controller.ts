import { Response, NextFunction } from 'express';
import { brandService } from './brand.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { sendSuccess, sendNotFound } from '../../shared/utils/response.js';

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brand = await brandService.create(req.workspace!.id, req.body);
    sendSuccess(res, brand, 201);
  } catch (error) {
    next(error);
  }
}

export async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.query.clientId as string | undefined;
    const brands = await brandService.getAll(req.workspace!.id, clientId);
    sendSuccess(res, brands);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brand = await brandService.getById(req.params.id, req.workspace!.id);
    if (!brand) {
      return sendNotFound(res, 'Brand');
    }
    sendSuccess(res, brand);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await brandService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Brand');
    }
    const brand = await brandService.update(req.params.id, req.body);
    sendSuccess(res, brand);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await brandService.getById(req.params.id, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Brand');
    }
    await brandService.delete(req.params.id);
    sendSuccess(res, { message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function grantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const existing = await brandService.getById(req.params.brandId, req.workspace!.id);
    if (!existing) {
      return sendNotFound(res, 'Brand');
    }
    await brandService.grantAccess(req.params.brandId, req.params.memberId);
    sendSuccess(res, { message: 'Access granted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function revokeAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await brandService.revokeAccess(req.params.brandId, req.params.memberId);
    sendSuccess(res, { message: 'Access revoked successfully' });
  } catch (error) {
    next(error);
  }
}

