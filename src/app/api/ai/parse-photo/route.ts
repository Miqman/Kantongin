import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

// Max 2MB base64 (~1.5MB image setelah compression)
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

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit: 10 req per menit (foto lebih berat dari voice) ────────────
    const ip = getClientIp(request);
    const rl = rateLimit(`ai-photo:${user.id}:${ip}`, { limit: 10, windowMs: 60_000 });
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

    const { imageBase64, mimeType } = parsed.data;

    // ── Ambil daftar kategori user ─────────────────────────────────────────────
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .or(`user_id.eq.${user.id},is_default.eq.true`);

    const categoryNames = (categories ?? []).map((c: { name: string }) => c.name);

    // ── Parse via AI (foto tidak disimpan, hanya diproses) ────────────────────
    const provider = getAIProvider();
    const result = await provider.parseReceiptImage(imageBase64, mimeType, categoryNames);

    // imageBase64 di-GC setelah function selesai — tidak disimpan ke mana pun

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/ai/parse-photo] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
