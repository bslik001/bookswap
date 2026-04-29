import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { listNotificationsSchema, broadcastSystemSchema } from './notification.schema';
import * as notificationController from './notification.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listNotificationsSchema, 'query'),
  notificationController.listNotifications,
);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', validateId, notificationController.markAsRead);

export default router;

// ── Routes admin (montees separement dans app.ts) ──
export const adminNotificationRouter = Router();

adminNotificationRouter.use(authenticate);
adminNotificationRouter.use(authorize('ADMIN'));

adminNotificationRouter.post(
  '/broadcast',
  validate(broadcastSystemSchema),
  notificationController.broadcastSystem,
);
