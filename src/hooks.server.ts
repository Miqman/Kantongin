import 'dotenv/config';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestEvent } from '@sveltejs/kit';
import type { AppUser } from '$lib/types';

export const handle = async ({
  event,
  resolve,
}: {
  event: RequestEvent;
  resolve: (
    event: RequestEvent,
    opts?: {
      filterSerializedResponseHeaders?: (name: string) => boolean;
      transformPageChunk?: (input: { html: string; done: boolean }) => string | undefined | Promise<string | undefined>;
      preload?: (input: { type: 'js' | 'css' | 'asset'; path: string }) => boolean;
    }
  ) => Promise<Response>;
}) => {
  event.locals.supabase = createSupabaseServerClient(event);

  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error || !user) {
      return { session: null, user: null };
    }

    return { session, user };
  };

  const { user } = await event.locals.safeGetSession();
  event.locals.user = user as AppUser | null;

  const response = await resolve(event, {
    filterSerializedResponseHeaders(name: string) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });

  // Standard Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=()'
  );

  return response;
};
