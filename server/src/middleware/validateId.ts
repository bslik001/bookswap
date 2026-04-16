import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const uuidSchema = z.object({
  id: z.string().uuid('Identifiant invalide'),
});

/**
 * Valide que req.params.id est un UUID valide.
 * A placer avant tout controller qui utilise req.params.id.
 */
export const validateId = (req: Request, _res: Response, next: NextFunction) => {
  const result = uuidSchema.safeParse(req.params);
  if (!result.success) {
    return next(result.error);
  }
  next();
};
