import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// 3 register attempts per 60 seconds per IP (lebih ketat dari login)
const REGISTER_LIMIT = { limit: 3, windowMs: 60_000 };

export async function POST(request: Request) {
  // ── Rate limiting ──
  const ip = getClientIp(request);
  const rl = rateLimit(ip, REGISTER_LIMIT);

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan pendaftaran. Coba lagi dalam 1 menit.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(REGISTER_LIMIT.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
