import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caracteres').max(100).optional(),
  lastName: z.string().min(2, 'Minimum 2 caracteres').max(100).optional(),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().min(5, 'Minimum 5 caracteres').max(500).optional(),
  gradeInterests: z.array(z.string()).min(1, 'Selectionnez au moins un niveau').optional(),
  fcmToken: z.string().max(500).optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'ADMIN', 'SUPPLIER']).optional(),
  search: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
