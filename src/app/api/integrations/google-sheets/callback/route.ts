import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/google/auth';
import { createSpreadsheet } from '@/lib/google/sheets';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      // User denied access
      return NextResponse.redirect(new URL('/profil?sheets=denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profil?sheets=error', request.url));
    }

    // Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== state) {
      return NextResponse.redirect(new URL('/profil?sheets=error', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/profil?sheets=error', request.url));
    }

    // Create spreadsheet for the user
    const spreadsheetId = await createSpreadsheet(tokens.access_token, user.email || 'user');

    // Save integration to database
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        provider: 'google_sheets',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        spreadsheet_id: spreadsheetId,
        is_active: true,
      }, {
        onConflict: 'user_id,provider'
      });

    if (dbError) {
      console.error('DB Error saving integration:', dbError);
      return NextResponse.redirect(new URL('/profil?sheets=error', request.url));
    }

    return NextResponse.redirect(new URL('/profil?sheets=connected', request.url));
  } catch (err) {
    console.error('Google Sheets Callback Error:', err);
    return NextResponse.redirect(new URL('/profil?sheets=error', request.url));
  }
}
