import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('is_active, last_synced_at, spreadsheet_id')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .single();

    if (!integration) {
      return NextResponse.json({
        connected: false,
        lastSynced: null,
        spreadsheetId: null,
      });
    }

    return NextResponse.json({
      connected: integration.is_active,
      lastSynced: integration.last_synced_at,
      spreadsheetId: integration.spreadsheet_id,
    });
  } catch (err) {
    console.error('Google Sheets Status Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
