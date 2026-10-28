import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = event.params;
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await event.request.json();
    const { amount, category_id, note, date } = body;

    const { data: transaction, error: dbError } = await event.locals.supabase
      .from('transactions')
      .update({ amount, category_id, note, date })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single();

    if (dbError) {
      console.error('[/api/transactions/[id] PUT] DB Error:', dbError);
      return json({ error: 'Gagal memperbarui transaksi' }, { status: 500 });
    }

    if (!transaction) {
      return json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    return json(transaction);
  } catch (err) {
    console.error('[/api/transactions/[id] PUT] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = event.params;
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const { error: dbError } = await event.locals.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[/api/transactions/[id] DELETE] DB Error:', dbError);
      return json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('[/api/transactions/[id] DELETE] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

