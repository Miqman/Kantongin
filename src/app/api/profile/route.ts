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
