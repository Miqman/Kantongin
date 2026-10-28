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
    const { name, icon, color } = body;

    const { data: cat } = await event.locals.supabase
      .from('categories')
      .select('is_default, user_id')
      .eq('id', id)
      .single();

    if (!cat) return json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    if (cat.is_default) return json({ error: 'Kategori default tidak bisa diubah' }, { status: 403 });
    if (cat.user_id !== user.id) return json({ error: 'Akses ditolak' }, { status: 403 });

    const { data, error: dbError } = await event.locals.supabase
      .from('categories')
      .update({ name, icon, color })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('[/api/categories/[id] PUT] DB Error:', dbError);
      return json({ error: 'Gagal update kategori' }, { status: 500 });
    }

    return json(data);
  } catch (err) {
    console.error('[/api/categories/[id] PUT] Server Error:', err);
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

    const { data: cat } = await event.locals.supabase
      .from('categories')
      .select('is_default, user_id')
      .eq('id', id)
      .single();

    if (cat?.is_default) {
      return json({ error: 'Kategori default tidak bisa dihapus' }, { status: 403 });
    }

    const { error: dbError } = await event.locals.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('[/api/categories/[id] DELETE] DB Error:', dbError);
      return json({ error: 'Gagal menghapus kategori' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('[/api/categories/[id] DELETE] Server Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

