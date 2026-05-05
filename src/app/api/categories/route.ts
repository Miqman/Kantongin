import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's custom categories + system default categories (user_id IS NULL)
    const { data: categories, error: dbError } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name', { ascending: true });

    if (dbError) {
      console.error('GET Categories Error:', dbError);
      return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 });
    }

    return NextResponse.json(categories ?? []);
  } catch (error) {
    console.error('GET Categories Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { name, icon, color, is_default } = json;

    const { data: category, error: dbError } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        icon,
        color,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('POST Category Error:', dbError);
      return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('POST Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
