import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const broadcastSystemSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(500),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type BroadcastSystemInput = z.infer<typeof broadcastSystemSchema>;
