import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z.number().refine((val) => val !== 0, 'amount tidak boleh 0'),
  category_id: z.string().uuid('category_id harus berupa UUID valid'),
  note: z.string().max(255, 'note maksimal 255 karakter').optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus format YYYY-MM-DD'),
});

export const batchBodySchema = z.object({
  transactions: z
    .array(transactionSchema)
    .min(1, 'Minimal 1 transaksi')
    .max(50, 'Maksimal 50 transaksi per request'),
});

export type TransactionSchema = typeof transactionSchema;
export type BatchBodySchema = typeof batchBodySchema;

