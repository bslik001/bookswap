import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Token manquant'));
  }

  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Token invalide ou expire'));
  }
};

export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Non authentifie'));
    }
    if (!roles.includes(req.user.role as Role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Action non autorisee pour votre role'));
    }
    next();
  };
