import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { refreshAccessToken } from '$lib/server/google/auth';
import { fullSync } from '$lib/server/google/sheets';

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration, error: fetchError } = await event.locals.supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .eq('is_active', true)
      .single();

    if (fetchError || !integration) {
      return json({ error: 'Google Sheets not connected' }, { status: 400 });
    }

    let accessToken = integration.access_token;
    const tokenExpiry = new Date(integration.token_expires_at);
    const now = new Date();

    if (tokenExpiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
      try {
        const refreshed = await refreshAccessToken(integration.refresh_token);
        accessToken = refreshed.access_token;

        await event.locals.supabase
          .from('user_integrations')
          .update({
            access_token: refreshed.access_token,
            token_expires_at: new Date(refreshed.expiry_date).toISOString(),
          })
          .eq('id', integration.id);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        await event.locals.supabase
          .from('user_integrations')
          .update({ is_active: false })
          .eq('id', integration.id);

        return json(
          {
            error: 'Token expired. Please reconnect Google Sheets.',
            needsReconnect: true,
          },
          { status: 401 }
        );
      }
    }

    const [txRes, catRes] = await Promise.all([
      event.locals.supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      event.locals.supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`),
    ]);

    const transactions = txRes.data || [];
    const categories = catRes.data || [];

    await fullSync(accessToken, integration.spreadsheet_id, transactions, categories);

    await event.locals.supabase
      .from('user_integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integration.id);

    return json({
      success: true,
      synced_at: new Date().toISOString(),
      transactions_count: transactions.length,
      categories_count: categories.length,
    });
  } catch (err) {
    console.error('Google Sheets Sync Error:', err);
    return json({ error: 'Sync failed' }, { status: 500 });
  }
};

