import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken } from '@/lib/google/auth';
import { fullSync } from '@/lib/google/sheets';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get integration
    const { data: integration, error: fetchError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .eq('is_active', true)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Google Sheets not connected' }, { status: 400 });
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    const tokenExpiry = new Date(integration.token_expires_at);
    const now = new Date();

    if (tokenExpiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
      // Token expired or will expire in 5 minutes — refresh it
      try {
        const refreshed = await refreshAccessToken(integration.refresh_token);
        accessToken = refreshed.access_token;

        // Update token in database
        await supabase
          .from('user_integrations')
          .update({
            access_token: refreshed.access_token,
            token_expires_at: new Date(refreshed.expiry_date).toISOString(),
          })
          .eq('id', integration.id);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        // Mark integration as inactive
        await supabase
          .from('user_integrations')
          .update({ is_active: false })
          .eq('id', integration.id);

        return NextResponse.json({ 
          error: 'Token expired. Please reconnect Google Sheets.',
          needsReconnect: true 
        }, { status: 401 });
      }
    }

    // Fetch all user data for full sync
    const [txRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
    ]);

    const transactions = txRes.data || [];
    const categories = catRes.data || [];

    // Perform full sync
    await fullSync(accessToken, integration.spreadsheet_id, transactions, categories);

    // Update last_synced_at
    await supabase
      .from('user_integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({ 
      success: true, 
      synced_at: new Date().toISOString(),
      transactions_count: transactions.length,
      categories_count: categories.length,
    });
  } catch (err) {
    console.error('Google Sheets Sync Error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
