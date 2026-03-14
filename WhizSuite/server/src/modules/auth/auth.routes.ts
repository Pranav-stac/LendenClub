import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validate.js';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.patch('/profile', authenticate, validateBody(updateProfileSchema), updateProfile);
router.put('/password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export { router as authRoutes };
