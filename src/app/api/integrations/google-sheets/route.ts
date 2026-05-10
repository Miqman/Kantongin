import { createClient } from '@/lib/supabase/server';
import { revokeToken } from '@/lib/google/auth';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get integration to revoke token
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google_sheets')
      .single();

    if (integration) {
      // Try to revoke the token (don't fail if this errors)
      try {
        if (integration.access_token) {
          await revokeToken(integration.access_token);
        }
      } catch (revokeErr) {
        console.warn('Token revoke failed (may already be revoked):', revokeErr);
      }

      // Delete from database
      await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google_sheets');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Google Sheets Disconnect Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
