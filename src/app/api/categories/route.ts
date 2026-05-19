import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'name wajib diisi').max(50, 'name maksimal 50 karakter'),
  icon: z.string().min(1, 'icon wajib diisi'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color harus format hex #RRGGBB'),
  is_default: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: categories, error: dbError } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name', { ascending: true });

    if (dbError) {
      return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 });
    }

    return NextResponse.json(categories ?? []);
  } catch {
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
    const parsed = categorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, icon, color, is_default } = parsed.data;

    const { data: category, error: dbError } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name, icon, color, is_default })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
