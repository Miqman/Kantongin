import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerSchema } from '$lib/schemas/auth';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';

const REGISTER_LIMIT = { limit: 3, windowMs: 60_000 };

export const POST: RequestHandler = async (event) => {
  const ip = getClientIp(event);
  const rl = rateLimit(`register:${ip}`, REGISTER_LIMIT);

  if (!rl.success) {
    return json(
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
    const body = await event.request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const { data, error } = await event.locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${event.url.origin}/api/auth/callback`,
      },
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ user: data.user });
  } catch (err) {
    console.error('[/api/auth/register] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

