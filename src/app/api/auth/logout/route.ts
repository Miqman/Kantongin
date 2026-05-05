import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if session exists
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
