import { google } from 'googleapis';

// Using drive.file scope (non-sensitive) instead of spreadsheets (sensitive)
// drive.file grants access only to files created by this app — no Google verification needed
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate the Google OAuth URL for user consent
 */
export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: userId, // Pass userId as state for callback verification
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date!,
  };
}

/**
 * Revoke a token (used on disconnect)
 */
export async function revokeToken(token: string) {
  const oauth2Client = getOAuth2Client();
  await oauth2Client.revokeToken(token);
}

/**
 * Get an authenticated OAuth2 client with valid token
 */
export function getAuthenticatedClient(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}
