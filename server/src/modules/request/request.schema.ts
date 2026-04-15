import { z } from 'zod';

export const createRequestSchema = z.object({
  bookId: z.string().uuid('ID de livre invalide'),
});

export const listRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'ACCEPTED', 'REFUSED', 'COMPLETED']).optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'ACCEPTED', 'REFUSED', 'COMPLETED']),
  adminNotes: z.string().max(1000).optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ListRequestsInput = z.infer<typeof listRequestsSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
