import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Guest user — no exclusive themes
    if (authError || !user) {
      return NextResponse.json({ allowed_themes: [] });
    }

    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('allowed_themes')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      // Profile row missing (e.g. old account before trigger) — return empty
      return NextResponse.json({ allowed_themes: [] });
    }

    return NextResponse.json({
      allowed_themes: profile.allowed_themes ?? [],
    });
  } catch {
    return NextResponse.json({ allowed_themes: [] });
  }
}

// ── PATCH /api/profile ────────────────────────────────────────────────────────
// Body: { full_name?: string; avatar_url?: string }
// Updates Supabase Auth user_metadata for the currently logged-in user.
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, avatar_url } = body as {
      full_name?: string;
      avatar_url?: string;
    };

    // Merge with existing metadata so we don't overwrite unrelated fields
    const updatedMetadata: Record<string, unknown> = {
      ...user.user_metadata,
    };
    if (full_name !== undefined) updatedMetadata.full_name = full_name.trim();
    if (avatar_url !== undefined) updatedMetadata.avatar_url = avatar_url;

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: updatedMetadata,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

