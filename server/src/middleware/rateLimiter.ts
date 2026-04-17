import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

const IS_TEST = process.env.NODE_ENV === 'test';

const noop: RequestHandler = (_req, _res, next) => next();

export const globalLimiter: RequestHandler = IS_TEST
  ? noop
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Trop de requetes, reessayez dans un instant',
        },
      },
    });

export const createRateLimiter = (windowMs: number, max: number): RequestHandler =>
  IS_TEST
    ? noop
    : rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Trop de requetes, reessayez dans un instant',
          },
        },
      });
