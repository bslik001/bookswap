import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { updateProfileSchema, listUsersSchema } from './user.schema';
import * as userController from './user.controller';

const router = Router();

// Toutes les routes users necessitent une authentification
router.use(authenticate);

// ── Routes utilisateur ──
// IMPORTANT : /me avant /:id pour eviter qu'Express interprete "me" comme un UUID
router.get('/me', userController.getProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.delete('/me', userController.deleteAccount);
router.get('/:id', validateId, userController.getPublicProfile);

export default router;

// ── Routes admin (montees separement dans app.ts) ──
export const adminUserRouter = Router();

adminUserRouter.use(authenticate);
adminUserRouter.use(authorize('ADMIN'));

adminUserRouter.get('/stats', userController.getStats);
adminUserRouter.get('/', validate(listUsersSchema, 'query'), userController.listUsers);
adminUserRouter.put('/:id/block', validateId, userController.blockUser);
