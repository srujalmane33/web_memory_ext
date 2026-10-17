import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    config.dashboardOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or extension service workers)
        if (!origin) return callback(null, true);
        if (origin.startsWith('chrome-extension://')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (config.nodeEnv === 'development') return callback(null, true);

        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser with 1MB limit to protect server memory
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'web-memory-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/memories', memoryRoutes);
  app.use('/api/ai', aiRoutes);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      },
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
