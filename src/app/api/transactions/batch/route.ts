import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions } = await request.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const dataToInsert = transactions.map((t: any) => ({
      user_id: user.id,
      amount: t.amount,
      category_id: t.category_id,
      note: t.note ?? '',
      date: t.date,
      created_at: t.created_at ?? new Date().toISOString(),
    }));

    const { data, error: dbError } = await supabase
      .from('transactions')
      .insert(dataToInsert)
      .select('id');

    if (dbError) {
      console.error('Batch insert error:', dbError);
      return NextResponse.json(
        { error: 'Gagal migrasi data', message: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: data?.length ?? 0 }, { status: 201 });
  } catch (error: any) {
    console.error('Batch insert error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
