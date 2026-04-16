import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Erreurs applicatives custom
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Erreurs de validation Zod
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Donnees invalides',
        details,
      },
    });
  }

  // Erreurs Prisma (detection par nom de classe pour eviter import avant generation)
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = (prismaErr.meta?.target as string[])?.join(', ') || 'champ';
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Une valeur unique existe deja pour: ${target}`,
        },
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ressource introuvable',
        },
      });
    }
  }

  // Erreur generique
  logger.error({ err }, 'Erreur non geree');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
