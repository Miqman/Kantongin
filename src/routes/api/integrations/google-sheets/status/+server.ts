import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration } = await event.locals.supabase
      .from('user_integrations')
      .select('is_active, last_synced_at, spreadsheet_id')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .single();

    if (!integration) {
      return json({
        connected: false,
        lastSynced: null,
        spreadsheetId: null,
      });
    }

    return json({
      connected: integration.is_active,
      lastSynced: integration.last_synced_at,
      spreadsheetId: integration.spreadsheet_id,
    });
  } catch (err) {
    console.error('Google Sheets Status Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

