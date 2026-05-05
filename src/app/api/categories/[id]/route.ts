import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent deleting default/system categories
    const { data: cat } = await supabase
      .from('categories')
      .select('is_default, user_id')
      .eq('id', id)
      .single();

    if (cat?.is_default) {
      return NextResponse.json({ error: 'Kategori default tidak bisa dihapus' }, { status: 403 });
    }

    const { error: dbError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Only owner can delete

    if (dbError) {
      console.error('DELETE Category Error:', dbError);
      return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { name, icon, color } = json;

    // Verify ownership and not default
    const { data: cat } = await supabase
      .from('categories')
      .select('is_default, user_id')
      .eq('id', id)
      .single();

    if (!cat) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    if (cat.is_default) return NextResponse.json({ error: 'Kategori default tidak bisa diubah' }, { status: 403 });
    if (cat.user_id !== user.id) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const { data, error: dbError } = await supabase
      .from('categories')
      .update({ name, icon, color })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('PUT Category Error:', dbError);
      return NextResponse.json({ error: 'Gagal update kategori' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT Category Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
