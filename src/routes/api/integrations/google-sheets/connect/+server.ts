import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUrl } from '$lib/server/google/auth';

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = getAuthUrl(user.id);
    return json({ authUrl });
  } catch (err) {
    console.error('Google Sheets Connect Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

