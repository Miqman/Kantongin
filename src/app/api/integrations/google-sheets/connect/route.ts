import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/google/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = getAuthUrl(user.id);
    return NextResponse.json({ authUrl });
  } catch (err) {
    console.error('Google Sheets Connect Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
