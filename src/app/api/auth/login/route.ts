import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// 5 attempts per 60 seconds per IP
const LOGIN_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(request: Request) {
  // ── Rate limiting ──
  const ip = getClientIp(request);
  const rl = rateLimit(ip, LOGIN_LIMIT);

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(LOGIN_LIMIT.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
