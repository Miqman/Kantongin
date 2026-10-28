import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { categorySchema } from '$lib/schemas/category';

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: categories, error: dbError } = await event.locals.supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name', { ascending: true });

    if (dbError) {
      console.error('[/api/categories GET] DB Error:', dbError);
      return json({ error: 'Gagal mengambil kategori' }, { status: 500 });
    }

    return json(categories ?? []);
  } catch (err) {
    console.error('[/api/categories GET] Server Error:', err);
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
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, icon, color, is_default } = parsed.data;

    const { data: category, error: dbError } = await event.locals.supabase
      .from('categories')
      .insert({ user_id: user.id, name, icon, color, is_default })
      .select()
      .single();

    if (dbError) {
      console.error('[/api/categories POST] DB Error:', dbError);
      return json({ error: 'Gagal menambah kategori' }, { status: 500 });
    }

    return json(category, { status: 201 });
  } catch (err) {
    console.error('[/api/categories POST] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

