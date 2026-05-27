import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().refine((val) => val !== 0, 'amount tidak boleh 0'),
  category_id: z.string().uuid('category_id harus berupa UUID valid'),
  note: z.string().max(255, 'note maksimal 255 karakter').optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus format YYYY-MM-DD'),
});

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor'); // ISO datetime string of last item's created_at
    const startDate = searchParams.get('start_date'); // YYYY-MM-DD
    const endDate = searchParams.get('end_date'); // YYYY-MM-DD
    const limitParam = searchParams.get('limit');

    let limit = PAGE_SIZE;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    let query = supabase
      .from('transactions')
      .select(`*, category:categories(*)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Date range filtering
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Cursor-based pagination: fetch items older than the cursor
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: transactions, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
    }

    const items = transactions ?? [];
    const nextCursor = items.length === limit
      ? items[items.length - 1].created_at
      : null;

    return NextResponse.json({
      data: items,
      nextCursor,
      hasMore: nextCursor !== null,
    });
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
    const parsed = transactionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, category_id, note, date } = parsed.data;

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, amount, category_id, note, date })
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Gagal menambah transaksi' }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
