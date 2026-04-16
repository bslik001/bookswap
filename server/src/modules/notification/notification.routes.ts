import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { validateId } from '../../middleware/validateId';
import { listNotificationsSchema } from './notification.schema';
import * as notificationController from './notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsSchema, 'query'), notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', validateId, notificationController.markAsRead);

export default router;
