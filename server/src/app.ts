import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, AppError } from './middleware/errorHandler';
import { prisma } from './lib/prisma';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes, { adminUserRouter } from './modules/user/user.routes';
import bookRoutes from './modules/book/book.routes';
import requestRoutes, { adminRequestRouter } from './modules/request/request.routes';
import supplyRoutes from './modules/supply/supply.routes';
import notificationRoutes from './modules/notification/notification.routes';

const app = express();

// ── Middlewares globaux ──
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);

// ── Documentation API ──
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BookSwap API',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ── Health checks ──
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ready', database: 'connected' } });
  } catch {
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Base de donnees inaccessible', database: 'disconnected' },
    });
  }
});

// ── Routes API ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/books', bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin/requests', adminRequestRouter);
app.use('/api/supplies', supplyRoutes);
app.use('/api/notifications', notificationRoutes);

// ── 404 pour routes non trouvees ──
app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route introuvable'));
});

// ── Gestionnaire d'erreurs global (toujours en dernier) ──
app.use(errorHandler);

export default app;
