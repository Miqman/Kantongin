import { z } from 'zod';

export const profileSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().or(z.literal('')).optional(),
  payday_date: z.number().int().min(1).max(31).optional(),
});

export type ProfileSchema = typeof profileSchema;

