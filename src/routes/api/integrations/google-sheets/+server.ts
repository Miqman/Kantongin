import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeToken } from '$lib/server/google/auth';

export const DELETE: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration } = await event.locals.supabase
      .from('user_integrations')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .single();

    if (integration) {
      try {
        if (integration.access_token) {
          await revokeToken(integration.access_token);
        }
      } catch (revokeErr) {
        console.warn('Token revoke failed (may already be revoked):', revokeErr);
      }

      await event.locals.supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_sheets');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Google Sheets Disconnect Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

