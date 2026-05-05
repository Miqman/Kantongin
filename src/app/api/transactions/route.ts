import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transactions, error: dbError } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (dbError) {
      console.error('GET Transactions Error:', dbError);
      return NextResponse.json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
    }

    return NextResponse.json(transactions ?? []);
  } catch (error) {
    console.error('GET Transactions Error:', error);
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
    const { amount, category_id, note, date } = json;

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount,
        category_id,
        note: note ?? '',
        date,
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (dbError) {
      console.error('POST Transaction Error:', dbError);
      return NextResponse.json({ error: 'Gagal menambah transaksi' }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST Transaction Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
