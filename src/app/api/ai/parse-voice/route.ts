import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const bodySchema = z.object({
  transcript: z.string().min(1, 'Transcript tidak boleh kosong').max(1000, 'Transcript terlalu panjang'),
});

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit: 20 req per menit per user ─────────────────────────────────
    const ip = getClientIp(request);
    const rl = rateLimit(`ai-voice:${user.id}:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { transcript } = parsed.data;

    // ── Ambil daftar kategori user ─────────────────────────────────────────────
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .or(`user_id.eq.${user.id},is_default.eq.true`);

    const categoryNames = (categories ?? []).map((c: { name: string }) => c.name);

    // ── Parse via AI ──────────────────────────────────────────────────────────
    const provider = getAIProvider();
    const result = await provider.parseVoiceTranscript(transcript, categoryNames);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/ai/parse-voice] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
