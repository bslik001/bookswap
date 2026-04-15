import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(2, 'Minimum 2 caracteres').max(255),
  author: z.string().max(255).optional(),
  grade: z.string().min(1, 'Niveau requis').max(100),
  className: z.string().max(100).optional(),
  condition: z.enum(['NEW', 'USED'], { required_error: 'Etat requis (NEW ou USED)' }),
  description: z.string().max(2000).optional(),
});

export const updateBookSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  author: z.string().max(255).optional(),
  grade: z.string().min(1).max(100).optional(),
  className: z.string().max(100).optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  description: z.string().max(2000).optional(),
});

export const listBooksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  grade: z.string().optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'EXCHANGED']).optional(),
  search: z.string().optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksInput = z.infer<typeof listBooksSchema>;
