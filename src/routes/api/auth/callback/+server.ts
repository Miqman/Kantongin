import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get('code');
  const next = event.url.searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const { error } = await event.locals.supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(303, safeNext);
    }
  }

  redirect(303, '/login?message=Gagal%20masuk,%20silakan%20coba%20lagi');
};

