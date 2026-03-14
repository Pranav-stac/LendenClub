import { Router } from 'express';
import multer from 'multer';
import { mediaController } from './media.controller.js';
import { authenticate } from '../../shared/middleware/auth.js';
import { loadWorkspace, requirePermission } from '../../shared/middleware/workspace.js';

const router = Router();

// Configure multer for memory storage (files go directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for videos
    files: 10, // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
      // Videos
      'video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo', 'video/x-matroska',
      // Documents
      'application/pdf',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images, videos, PDFs`));
    }
  },
});

// Auth required for all routes
router.use(authenticate);
router.use(loadWorkspace);

// ============ UPLOADS (use x-workspace-id header) ============
router.post('/upload', requirePermission('media:upload'), upload.single('file'), mediaController.upload);
router.post('/upload/multiple', requirePermission('media:upload'), upload.array('files', 10), mediaController.uploadMultiple);
router.post('/upload-multiple', requirePermission('media:upload'), upload.array('files', 10), mediaController.uploadMultiple); // Alias for Postman compatibility

// ============ TYPE-SPECIFIC UPLOADS ============
// Image-only upload with imageType (photo, graphic, avatar, banner, thumbnail)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Video-only upload with videoType (post, story, reel)
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

router.post('/images/upload', requirePermission('media:upload'), uploadImage.single('file'), mediaController.uploadImage);
router.post('/videos/upload', requirePermission('media:upload'), uploadVideo.single('file'), mediaController.uploadVideo);

// ============ CLIENT/BRAND SPECIFIC UPLOADS ============
router.post('/clients/:clientId/upload', requirePermission('media:upload'), upload.single('file'), mediaController.uploadForClient);
router.post('/brands/:brandId/upload', requirePermission('media:upload'), upload.single('file'), mediaController.uploadForBrand);

// ============ GET ROUTES ============
router.get('/', mediaController.getAll);
router.get('/images', mediaController.getImages);
router.get('/videos', mediaController.getVideos);
router.get('/documents', mediaController.getDocuments);
router.get('/stats', mediaController.getStats);
router.get('/signed-url', mediaController.getSignedUrl);
router.get('/:id', mediaController.getById);

// ============ DELETE ============
router.delete('/:id', requirePermission('media:delete'), mediaController.delete);export { router as mediaRoutes };
