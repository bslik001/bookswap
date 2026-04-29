import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as notificationService from './notification.service';
import type { ListNotificationsInput, BroadcastSystemInput } from './notification.schema';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as ListNotificationsInput;
  const result = await notificationService.listNotifications(req.user!.id, page, limit);
  res.json({ success: true, data: result.notifications, meta: result.meta });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.getUnreadCount(req.user!.id);
  res.json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.user!.id, req.params.id as string);
  res.json({ success: true, data: { message: 'Notification marquee comme lue' } });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!.id);
  res.json({ success: true, data: result });
});

export const broadcastSystem = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as BroadcastSystemInput;
  const result = await notificationService.broadcastSystemNotification(content);
  res.status(201).json({ success: true, data: result });
});
