import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ allowed_themes: [] });
    }

    const { data: profile, error: dbError } = await event.locals.supabase
      .from('profiles')
      .select('allowed_themes')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      return json({ allowed_themes: [] });
    }

    return json({
      allowed_themes: profile.allowed_themes ?? [],
    });
  } catch {
    return json({ allowed_themes: [] });
  }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await event.request.json();
    const { full_name, avatar_url, payday_date } = body as {
      full_name?: string;
      avatar_url?: string;
      payday_date?: number;
    };

    const updatedMetadata: Record<string, unknown> = {
      ...user.user_metadata,
    };
    if (full_name !== undefined) updatedMetadata.full_name = full_name.trim();
    if (avatar_url !== undefined) updatedMetadata.avatar_url = avatar_url;
    if (payday_date !== undefined) {
      const p = Math.max(1, Math.min(31, Math.floor(Number(payday_date))));
      updatedMetadata.payday_date = p;
    }

    const { data, error: updateError } = await event.locals.supabase.auth.updateUser({
      data: updatedMetadata,
    });

    if (updateError) {
      return json({ error: updateError.message }, { status: 500 });
    }

    return json({ user: data.user });
  } catch (err) {
    console.error('[/api/profile PATCH] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

