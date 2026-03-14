import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const stats = await dashboardService.getStats(workspaceId);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
