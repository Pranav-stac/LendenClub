import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';

// Import routes
import { authRoutes } from './modules/auth/index.js';
import { workspaceRoutes } from './modules/workspace/index.js';
import { clientRoutes } from './modules/client/index.js';
import { brandRoutes } from './modules/brand/index.js';
import { platformRoutes } from './modules/platform/index.js';
import { postRoutes } from './modules/post/index.js';
import { calendarRoutes } from './modules/calendar/index.js';
import { reviewRoutes } from './modules/review/index.js';
import { mediaRoutes } from './modules/media/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { notificationRoutes } from './modules/notification/index.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function bootstrap() {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 WhizSuite Server is running!                         ║
║                                                           ║
║   Local:    http://localhost:${config.port}                    ║
║   Health:   http://localhost:${config.port}/health              ║
║   API:      http://localhost:${config.port}/api                 ║
║                                                           ║
║   Environment: ${config.env.padEnd(40)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
