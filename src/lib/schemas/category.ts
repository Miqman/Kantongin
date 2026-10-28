import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'name wajib diisi').max(50, 'name maksimal 50 karakter'),
  icon: z.string().min(1, 'icon wajib diisi'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color harus format hex #RRGGBB'),
  is_default: z.boolean().optional().default(false),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'name wajib diisi').max(50, 'name maksimal 50 karakter').optional(),
  icon: z.string().min(1, 'icon wajib diisi').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color harus format hex #RRGGBB').optional(),
});

export type CategorySchema = typeof categorySchema;
export type CategoryUpdateSchema = typeof categoryUpdateSchema;

