import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions } = await request.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Since we need to insert transactions, we map them
    // Make sure category_id is valid, or just assume it is.
    const dataToInsert = transactions.map((t: any) => ({
      user_id: user.id,
      amount: t.amount,
      category_id: t.category_id,
      note: t.note || '',
      date: new Date(t.date),
      created_at: t.created_at ? new Date(t.created_at) : new Date()
    }));

    // In Prisma, we use createMany
    const result = await prisma.transaction.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 201 });
  } catch (error: any) {
    console.error('Batch insert error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
