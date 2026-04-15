import { z } from 'zod';

export const createSupplySchema = z.object({
  name: z.string().min(2, 'Minimum 2 caracteres').max(255),
  type: z.enum(['NOTEBOOK', 'PEN', 'BAG', 'OTHER'], { required_error: 'Type requis' }),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, 'Prix invalide').optional(),
});

export const listSuppliesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['NOTEBOOK', 'PEN', 'BAG', 'OTHER']).optional(),
});

export const contactSupplierSchema = z.object({
  message: z.string().min(1, 'Message requis').max(1000),
});

export type CreateSupplyInput = z.infer<typeof createSupplySchema>;
export type ListSuppliesInput = z.infer<typeof listSuppliesSchema>;
export type ContactSupplierInput = z.infer<typeof contactSupplierSchema>;
