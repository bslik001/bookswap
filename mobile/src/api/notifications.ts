import { api } from './client';
import type { NotificationsPage } from '@/types/notification';

export const notificationsApi = {
  list: (page = 1, limit = 30) =>
    api.get<NotificationsPage>(`/notifications?page=${page}&limit=${limit}`),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.put<{ message?: string }>(`/notifications/${id}/read`),
  markAllRead: () => api.put<{ updated: number }>('/notifications/read-all'),
};
