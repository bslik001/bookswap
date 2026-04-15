import { prisma } from '../../lib/prisma';
import { sendPushNotification } from '../../config/firebase';
import { paginate, buildMeta } from '../../utils/pagination';
import type { NotificationType } from '@prisma/client';

// ── Creer une notification (DB + push optionnel) ──
export const createNotification = async (
  userId: string,
  type: NotificationType,
  content: string
) => {
  const notification = await prisma.notification.create({
    data: { userId, type, content },
  });

  // Envoyer le push si l'utilisateur a un FCM token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });

  if (user?.fcmToken) {
    try {
      await sendPushNotification(user.fcmToken, 'BookSwap', content);
    } catch (err) {
      // Le push est best-effort, on ne bloque pas si ca echoue
      console.error('Push notification echouee:', err);
    }
  }

  return notification;
};

// ── Lister les notifications ──
export const listNotifications = async (userId: string, page: number, limit: number) => {
  const { skip, take } = paginate(page, limit);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, meta: buildMeta(total, page, limit) };
};

// ── Marquer une notification comme lue ──
export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  return notification;
};

// ── Marquer toutes comme lues ──
export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updated: result.count };
};

// ── Nombre de non-lues ──
export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { count };
};
