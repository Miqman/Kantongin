import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
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

    const json = await request.json();
    const { amount, category_id, note, date } = json;

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .update({ amount, category_id, note, date })
      .eq('id', id)
      .eq('user_id', user.id) // RLS double-check: only owner can update
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      console.error('PUT Transaction Error:', dbError);
      return NextResponse.json({ error: 'Gagal memperbarui transaksi' }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('PUT Transaction Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const { error: dbError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // RLS double-check: only owner can delete

    if (dbError) {
      console.error('DELETE Transaction Error:', dbError);
      return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Transaction Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
