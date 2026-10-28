import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { batchBodySchema } from '$lib/schemas/transaction';
import { rateLimit, getClientIp } from '$lib/server/rate-limit';

export const POST: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(event);
    const rl = rateLimit(`transactions-batch:${user.id}:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.success) {
      return json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }

    const body = await event.request.json();
    const parsed = batchBodySchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { transactions } = parsed.data;

    const dataToInsert = transactions.map((t) => ({
      user_id: user.id,
      amount: t.amount,
      category_id: t.category_id,
      note: t.note ?? '',
      date: t.date,
      created_at: new Date().toISOString(),
    }));

    const { data, error: dbError } = await event.locals.supabase
      .from('transactions')
      .insert(dataToInsert)
      .select('id');

    if (dbError) {
      console.error('[/api/transactions/batch] DB error:', dbError);
      return json({ error: 'Gagal menyimpan transaksi', message: dbError.message }, { status: 500 });
    }

    return json({ success: true, count: data?.length ?? 0 }, { status: 201 });
  } catch (err) {
    console.error('[/api/transactions/batch] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

