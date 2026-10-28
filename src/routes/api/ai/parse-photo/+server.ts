import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIProvider } from '$lib/server/ai';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';
import { z } from 'zod';

const MAX_BASE64_SIZE = 2 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'Image tidak boleh kosong')
    .refine((val) => val.length <= MAX_BASE64_SIZE, 'Ukuran gambar terlalu besar (max ~1.5MB)'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const, {
    message: 'Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.',
  }),
});

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(event);
    const rl = rateLimit(`ai-photo:${user.id}:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.success) {
      return json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }

    const body = await event.request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType } = parsed.data;

    const { data: categories } = await event.locals.supabase
      .from('categories')
      .select('name')
      .or(`user_id.eq.${user.id},is_default.eq.true`);

    const categoryNames = (categories ?? []).map((c: { name: string }) => c.name);

    const provider = getAIProvider();
    const result = await provider.parseReceiptImage(imageBase64, mimeType, categoryNames);

    return json(result);
  } catch (err) {
    console.error('[/api/ai/parse-photo] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return json({ error: message }, { status: 500 });
  }
};

