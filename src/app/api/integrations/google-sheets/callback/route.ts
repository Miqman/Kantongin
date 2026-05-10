import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/google/auth';
import { createSpreadsheet } from '@/lib/google/sheets';
import { NextRequest, NextResponse } from 'next/server';

function redirectWithError(request: NextRequest, reason: string, details?: string) {
  const url = new URL('/profil', request.url);
  url.searchParams.set('sheets', 'error');
  url.searchParams.set('reason', reason);
  if (details) {
    url.searchParams.set('details', details.substring(0, 200));
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const oauthError = searchParams.get('error');

  console.log('[Sheets Callback] Received:', { 
    hasCode: !!code, 
    state, 
    oauthError 
  });

  if (oauthError) {
    console.error('[Sheets Callback] OAuth error:', oauthError);
    return redirectWithError(request, 'denied', oauthError);
  }

  if (!code) {
    return redirectWithError(request, 'no_code', 'Missing authorization code');
  }

  if (!state) {
    return redirectWithError(request, 'no_state', 'Missing state parameter');
  }

  // Step 1: Verify user is authenticated
  let supabase;
  let user;
  try {
    supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[Sheets Callback] Auth error:', authError);
      return redirectWithError(request, 'auth_failed', authError.message);
    }
    
    if (!authUser) {
      return redirectWithError(request, 'not_authenticated', 'User not logged in');
    }

    if (authUser.id !== state) {
      return redirectWithError(request, 'state_mismatch', `Expected ${state}, got ${authUser.id}`);
    }

    user = authUser;
  } catch (err) {
    console.error('[Sheets Callback] Supabase init error:', err);
    return redirectWithError(request, 'supabase_error', err instanceof Error ? err.message : 'Unknown');
  }

  // Step 2: Exchange code for tokens
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
    console.log('[Sheets Callback] Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });
  } catch (err) {
    console.error('[Sheets Callback] Token exchange failed:', err);
    return redirectWithError(request, 'token_exchange_failed', err instanceof Error ? err.message : 'Unknown');
  }

  if (!tokens.access_token) {
    return redirectWithError(request, 'no_access_token', 'Google did not return an access token');
  }

  if (!tokens.refresh_token) {
    return redirectWithError(request, 'no_refresh_token', 'Google did not return a refresh token. Try revoking app access in Google Account settings and retry.');
  }

  // Step 3: Create spreadsheet
  let spreadsheetId;
  try {
    spreadsheetId = await createSpreadsheet(tokens.access_token, user.email || 'user');
    console.log('[Sheets Callback] Spreadsheet created:', spreadsheetId);
  } catch (err) {
    console.error('[Sheets Callback] Spreadsheet creation failed:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown';
    return redirectWithError(request, 'spreadsheet_failed', errMsg);
  }

  // Step 4: Save to database
  try {
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
      console.error('[Sheets Callback] DB error:', dbError);
      return redirectWithError(request, 'db_error', `${dbError.code}: ${dbError.message}`);
    }
  } catch (err) {
    console.error('[Sheets Callback] Unexpected DB error:', err);
    return redirectWithError(request, 'db_exception', err instanceof Error ? err.message : 'Unknown');
  }

  console.log('[Sheets Callback] Success for user:', user.email);
  return NextResponse.redirect(new URL('/profil?sheets=connected', request.url));
}
