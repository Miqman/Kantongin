import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updatePasswordSchema } from '$lib/schemas/auth';

export const POST: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) {
    return json({ error: 'Sesi tidak valid atau telah kedaluwarsa' }, { status: 401 });
  }

  try {
    const body = await event.request.json();
    const parsed = updatePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { password } = parsed.data;
    const { error } = await event.locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({ message: 'Password berhasil diperbarui' });
  } catch (err) {
    console.error('[/api/auth/update-password] Error:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

