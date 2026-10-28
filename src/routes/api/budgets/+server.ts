import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { budgetSchema, budgetUpdateSchema } from '$lib/schemas/budget';

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: budgets, error: dbError } = await event.locals.supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[/api/budgets GET] DB Error:', dbError);
      return json({ error: 'Gagal mengambil budget' }, { status: 500 });
    }

    return json(budgets ?? []);
  } catch (err) {
    console.error('[/api/budgets GET] Server Error:', err);
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
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { limit_amount, period, category_id } = parsed.data;

    const { data: budget, error: dbError } = await event.locals.supabase
      .from('budgets')
      .insert({ user_id: user.id, category_id, limit_amount, period })
      .select('*, category:categories(*)')
      .single();

    if (dbError) {
      console.error('[/api/budgets POST] DB Error:', dbError);
      return json({ error: 'Gagal menambah budget' }, { status: 500 });
    }

    return json(budget, { status: 201 });
  } catch (err) {
    console.error('[/api/budgets POST] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await event.request.json();
    const parsed = budgetUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, limit_amount, category_id, period } = parsed.data;

    const { data: budget, error: dbError } = await event.locals.supabase
      .from('budgets')
      .update({ limit_amount, category_id, period })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single();

    if (dbError) {
      console.error('[/api/budgets PUT] DB Error:', dbError);
      return json({ error: 'Gagal update budget' }, { status: 500 });
    }

    return json(budget);
  } catch (err) {
    console.error('[/api/budgets PUT] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = event.url.searchParams.get('id');
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }

    const { error: dbError } = await event.locals.supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[/api/budgets DELETE] DB Error:', dbError);
      return json({ error: 'Gagal menghapus budget' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('[/api/budgets DELETE] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

