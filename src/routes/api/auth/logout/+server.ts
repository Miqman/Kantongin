import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  try {
    if (event.locals.user) {
      await event.locals.supabase.auth.signOut();
    }
    return json({ success: true });
  } catch (err) {
    console.error('[/api/auth/logout] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

