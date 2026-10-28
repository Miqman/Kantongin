import { redirect, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const origin = event.url.origin;
  const { data, error } = await event.locals.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    redirect(303, '/login?message=Gagal%20menghubungkan%20ke%20Google');
  }

  redirect(303, data.url, { external: true });
};

export const POST: RequestHandler = async (event) => {
  const origin = event.url.origin;
  const { data, error } = await event.locals.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    return json({ error: error?.message ?? 'Gagal membuat URL OAuth' }, { status: 500 });
  }

  return json({ url: data.url });
};

