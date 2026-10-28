import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { transactionSchema } from '$lib/schemas/transaction';

const PAGE_SIZE = 50;

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = event.url.searchParams;
    const cursor = searchParams.get('cursor');       // ISO datetime of last item
    const startDate = searchParams.get('start_date'); // YYYY-MM-DD
    const endDate = searchParams.get('end_date');     // YYYY-MM-DD
    const limitParam = searchParams.get('limit');
    const typeParam = searchParams.get('type');         // 'income' | 'expense'
    const categoryId = searchParams.get('category_id'); // UUID
    const search = searchParams.get('search');          // free-text search on note

    let limit = PAGE_SIZE;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    let query = event.locals.supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (typeParam === 'income') query = query.lt('amount', 0);
    else if (typeParam === 'expense') query = query.gt('amount', 0);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (search) query = query.ilike('note', `%${search}%`);
    if (cursor) query = query.lt('created_at', cursor);

    const { data: transactions, error: dbError } = await query;

    if (dbError) {
      console.error('[/api/transactions GET] DB Error:', dbError);
      return json({ error: 'Gagal mengambil transaksi' }, { status: 500 });
    }

    const items = transactions ?? [];
    const nextCursor = items.length === limit ? items[items.length - 1].created_at : null;

    return json({
      data: items,
      nextCursor,
      hasMore: nextCursor !== null,
    });
  } catch (err) {
    console.error('[/api/transactions GET] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await event.request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, category_id, note, date } = parsed.data;

    const { data: transaction, error: dbError } = await event.locals.supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount,
        category_id,
        note: note ?? '',
        date,
      })
      .select('*, category:categories(*)')
      .single();

    if (dbError) {
      console.error('[/api/transactions POST] DB Error:', dbError);
      return json({ error: 'Gagal menambah transaksi' }, { status: 500 });
    }

    return json(transaction, { status: 201 });
  } catch (err) {
    console.error('[/api/transactions POST] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

