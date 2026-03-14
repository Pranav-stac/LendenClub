import { Response, NextFunction } from 'express';
import { mediaService, UploadedFile } from './media.service.js';
import { sendSuccess, sendError, sendNotFound } from '../../shared/utils/response.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

export class MediaController {
  // General upload with optional client/brand/category
  async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const file = req.file as unknown as UploadedFile;
      const { clientId, brandId, category } = req.body;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const media = await mediaService.upload(file, {
        workspaceId,
        userId,
        clientId,
        brandId,
        category,
      });

      return sendSuccess(res, media, 201);
    } catch (error) {
      next(error);
    }
  }

  // Upload multiple files
  async uploadMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const files = req.files as unknown as UploadedFile[];
      const { clientId, brandId, category } = req.body;

      if (!files || files.length === 0) {
        return sendError(res, 'No files uploaded', 400);
      }

      const mediaList = await mediaService.uploadMultiple(files, {
        workspaceId,
        userId,
        clientId,
        brandId,
        category,
      });

      return sendSuccess(res, { 
        media: mediaList,
        urls: mediaList.map(m => m.url),
        count: mediaList.length,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Upload image with specific type
  async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const file = req.file as unknown as UploadedFile;
      const { clientId, brandId, imageType } = req.body;

      if (!file) {
        return sendError(res, 'No image uploaded', 400);
      }

      if (!file.mimetype.startsWith('image/')) {
        return sendError(res, 'File must be an image', 400);
      }

      const media = await mediaService.uploadImage(file, {
        workspaceId,
        userId,
        clientId,
        brandId,
        imageType: imageType || 'photo',
      });

      return sendSuccess(res, media, 201);
    } catch (error) {
      next(error);
    }
  }

  // Upload video with specific type
  async uploadVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const file = req.file as unknown as UploadedFile;
      const { clientId, brandId, videoType } = req.body;

      if (!file) {
        return sendError(res, 'No video uploaded', 400);
      }

      if (!file.mimetype.startsWith('video/')) {
        return sendError(res, 'File must be a video', 400);
      }

      const media = await mediaService.uploadVideo(file, {
        workspaceId,
        userId,
        clientId,
        brandId,
        videoType: videoType || 'post',
      });

      return sendSuccess(res, media, 201);
    } catch (error) {
      next(error);
    }
  }

  // Upload to specific brand folder
  async uploadForBrand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const { brandId } = req.params;
      const { category } = req.body;
      const file = req.file as unknown as UploadedFile;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const media = await mediaService.uploadForBrand(file, workspaceId, userId, brandId, category);
      return sendSuccess(res, media, 201);
    } catch (error) {
      next(error);
    }
  }

  // Upload to specific client folder
  async uploadForClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const userId = req.user!.id;
      const { clientId } = req.params;
      const { category } = req.body;
      const file = req.file as unknown as UploadedFile;

      if (!file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const media = await mediaService.uploadForClient(file, workspaceId, userId, clientId, category);
      return sendSuccess(res, media, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get all media with filters
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { clientId, brandId, type } = req.query;

      let result;
      
      if (brandId && typeof brandId === 'string') {
        result = await mediaService.getByBrand(workspaceId, brandId, {
          type: type as any,
          page,
          limit,
        });
      } else if (clientId && typeof clientId === 'string') {
        result = await mediaService.getByClient(workspaceId, clientId, {
          type: type as any,
          page,
          limit,
        });
      } else {
        result = await mediaService.getByWorkspace(workspaceId, {
          type: type as any,
          page,
          limit,
        });
      }

      return sendSuccess(res, result.media);
    } catch (error) {
      next(error);
    }
  }

  // Get only images
  async getImages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await mediaService.getImages(workspaceId, page, limit);
      return sendSuccess(res, result.media);
    } catch (error) {
      next(error);
    }
  }

  // Get only videos
  async getVideos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await mediaService.getVideos(workspaceId, page, limit);
      return sendSuccess(res, result.media);
    } catch (error) {
      next(error);
    }
  }

  // Get only documents
  async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await mediaService.getDocuments(workspaceId, page, limit);
      return sendSuccess(res, result.media);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const media = await mediaService.getById(id);
      
      if (!media) {
        return sendNotFound(res, 'Media');
      }

      return sendSuccess(res, media);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const workspaceId = req.workspace!.id;

      await mediaService.delete(id, workspaceId);
      return sendSuccess(res, { message: 'Media deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getSignedUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.query;
      
      if (!key || typeof key !== 'string') {
        return sendError(res, 'Key is required', 400);
      }

      const url = await mediaService.getSignedUrl(key);
      return sendSuccess(res, { url });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.workspace!.id;
      const stats = await mediaService.getStats(workspaceId);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
