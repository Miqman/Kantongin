import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai';

// Cache health check hasil selama 30 detik (per instance server)
let healthCache: { result: object; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function GET() {
  try {
    // Auth check — hanya user yang login boleh cek health
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kembalikan cache jika masih valid
    const now = Date.now();
    if (healthCache && now < healthCache.expiresAt) {
      return NextResponse.json({ ...healthCache.result, cached: true });
    }

    // Lakukan health check ke provider aktif
    const provider = getAIProvider();
    const result = await provider.healthCheck();

    // Simpan ke cache
    healthCache = {
      result,
      expiresAt: now + CACHE_TTL_MS,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/ai/health] Error:', err);
    return NextResponse.json(
      {
        online: false,
        provider: 'unknown',
        error: 'Gagal melakukan health check',
      },
      { status: 200 } // 200 agar client bisa baca body
    );
  }
}
