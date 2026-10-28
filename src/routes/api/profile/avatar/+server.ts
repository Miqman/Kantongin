import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await event.request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return json({ error: 'Berkas avatar tidak ditemukan' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const filePath = `${user.id}/avatar.webp`;

    const { error: uploadError } = await event.locals.supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      return json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = event.locals.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    return json({ url: publicUrl });
  } catch (err) {
    console.error('[/api/profile/avatar] Error:', err);
    return json({ error: 'Gagal mengunggah avatar' }, { status: 500 });
  }
};

