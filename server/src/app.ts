import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, AppError } from './middleware/errorHandler';

const app = express();

// ── Middlewares globaux ──
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// ── Routes API (seront ajoutees etape par etape) ──
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/books', bookRoutes);
// app.use('/api/requests', requestRoutes);
// app.use('/api/supplies', supplyRoutes);
// app.use('/api/notifications', notificationRoutes);

// ── 404 pour routes non trouvees ──
app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route introuvable'));
});

// ── Gestionnaire d'erreurs global (toujours en dernier) ──
app.use(errorHandler);

export default app;
