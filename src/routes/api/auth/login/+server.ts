import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginSchema } from '$lib/schemas/auth';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';

const LOGIN_LIMIT = { limit: 5, windowMs: 60_000 };

export const POST: RequestHandler = async (event) => {
  const ip = getClientIp(event);
  const rl = rateLimit(`login:${ip}`, LOGIN_LIMIT);

  if (!rl.success) {
    return json(
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
    const body = await event.request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const { data, error } = await event.locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return json({ error: error.message }, { status: 401 });
    }

    return json({ user: data.user });
  } catch (err) {
    console.error('[/api/auth/login] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

