import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';

const FORGOT_LIMIT = { limit: 3, windowMs: 60_000 };

export const POST: RequestHandler = async (event) => {
  const ip = getClientIp(event);
  const rl = rateLimit(`forgot-password:${ip}`, FORGOT_LIMIT);

  if (!rl.success) {
    return json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
      { status: 429 }
    );
  }

  try {
    const body = await event.request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Email tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const origin = event.url.origin;
    const { error } = await event.locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/callback?next=/update-password`,
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ message: 'Email reset password telah dikirim.' });
  } catch (err) {
    console.error('[/api/auth/forgot-password] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

