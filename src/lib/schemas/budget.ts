import { z } from 'zod';

export const budgetSchema = z.object({
  limit_amount: z.number().positive('limit_amount harus > 0'),
  period: z.enum(['monthly', 'weekly']).optional().default('monthly'),
  category_id: z.string().uuid().nullable().optional().default(null),
});

export const budgetUpdateSchema = z.object({
  id: z.string().uuid('id harus berupa UUID valid'),
  limit_amount: z.number().positive('limit_amount harus > 0'),
  period: z.enum(['monthly', 'weekly']).optional().default('monthly'),
  category_id: z.string().uuid().nullable().optional().default(null),
});

export type BudgetSchema = typeof budgetSchema;
export type BudgetUpdateSchema = typeof budgetUpdateSchema;

