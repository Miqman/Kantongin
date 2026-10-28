import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIProvider } from '$lib/server/ai';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';
import { z } from 'zod';

const bodySchema = z.object({
  transcript: z.string().min(1, 'Transcript tidak boleh kosong').max(1000, 'Transcript terlalu panjang'),
});

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(event);
    const rl = rateLimit(`ai-voice:${user.id}:${ip}`, { limit: 20, windowMs: 60_000 });
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

    const { transcript } = parsed.data;

    const { data: categories } = await event.locals.supabase
      .from('categories')
      .select('name')
      .or(`user_id.eq.${user.id},is_default.eq.true`);

    const categoryNames = (categories ?? []).map((c: { name: string }) => c.name);

    const provider = getAIProvider();
    const result = await provider.parseVoiceTranscript(transcript, categoryNames);

    return json(result);
  } catch (err) {
    console.error('[/api/ai/parse-voice] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return json({ error: message }, { status: 500 });
  }
};

