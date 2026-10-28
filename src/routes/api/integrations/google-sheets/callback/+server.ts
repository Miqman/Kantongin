import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens } from '$lib/server/google/auth';
import { createSpreadsheet } from '$lib/server/google/sheets';

function redirectWithError(reason: string, details?: string): never {
  const params = new URLSearchParams({
    sheets: 'error',
    reason,
  });
  if (details) {
    params.set('details', details.substring(0, 200));
  }
  redirect(303, `/profil?${params.toString()}`);
}

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state'); // userId
  const oauthError = event.url.searchParams.get('error');

  if (oauthError) {
    console.error('[Sheets Callback] OAuth error:', oauthError);
    return redirectWithError('denied', oauthError);
  }

  if (!code) {
    return redirectWithError('no_code', 'Missing authorization code');
  }

  if (!state) {
    return redirectWithError('no_state', 'Missing state parameter');
  }

  const user = event.locals.user;
  if (!user) {
    return redirectWithError('not_authenticated', 'User not logged in');
  }

  if (user.id !== state) {
    return redirectWithError('state_mismatch', `Expected ${state}, got ${user.id}`);
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error('[Sheets Callback] Token exchange failed:', err);
    return redirectWithError('token_exchange_failed', err instanceof Error ? err.message : 'Unknown');
  }

  if (!tokens.access_token) {
    return redirectWithError('no_access_token', 'Google did not return an access token');
  }

  if (!tokens.refresh_token) {
    return redirectWithError(
      'no_refresh_token',
      'Google did not return a refresh token. Try revoking app access in Google Account settings and retry.'
    );
  }

  let spreadsheetId: string;
  try {
    spreadsheetId = await createSpreadsheet(tokens.access_token, user.email || 'user');
  } catch (err) {
    console.error('[Sheets Callback] Spreadsheet creation failed:', err);
    return redirectWithError('spreadsheet_failed', err instanceof Error ? err.message : 'Unknown');
  }

  try {
    const { error: dbError } = await event.locals.supabase.from('user_integrations').upsert(
      {
        user_id: user.id,
        provider: 'google_sheets',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        spreadsheet_id: spreadsheetId,
        is_active: true,
      },
      {
        onConflict: 'user_id,provider',
      }
    );

    if (dbError) {
      console.error('[Sheets Callback] DB error:', dbError);
      return redirectWithError('db_error', `${dbError.code}: ${dbError.message}`);
    }
  } catch (err) {
    console.error('[Sheets Callback] Unexpected DB error:', err);
    return redirectWithError('db_exception', err instanceof Error ? err.message : 'Unknown');
  }

  return new Response(null, {
    status: 303,
    headers: { Location: '/profil?sheets=connected' },
  });
};

