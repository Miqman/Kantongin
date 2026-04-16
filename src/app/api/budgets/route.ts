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
    } else if (error || !finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budgets = await prisma.budget.findMany({
      where: { user_id: finalUserId },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budgets);
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
    } else if (authError || !finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { category_id, limit_amount, period } = json;

    const budget = await prisma.budget.create({
      data: {
        user_id: finalUserId,
        category_id,
        limit_amount,
        period: period || 'monthly',
      },
      include: {
        category: true,
      }
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
