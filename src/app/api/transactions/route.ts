import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    let finalUserId = user?.id;
    if (!finalUserId && process.env.NODE_ENV === 'development') {
      finalUserId = 'dummy-user-id-1';
    } else if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { user_id: finalUserId },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let finalUserId = user?.id;
    if (!finalUserId && process.env.NODE_ENV === 'development') {
      finalUserId = 'dummy-user-id-1';
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { amount, category_id, note, date } = json;

    const transaction = await prisma.transaction.create({
      data: {
        user_id: finalUserId,
        amount,
        category_id,
        note,
        date: new Date(date),
      },
      include: {
        category: true,
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
