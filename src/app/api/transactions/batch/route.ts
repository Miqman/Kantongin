import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

// ── Validation schema ─────────────────────────────────────────────────────────

const MAX_ITEMS = 50;

const transactionItemSchema = z.object({
  amount: z
    .number({ required_error: 'amount wajib diisi' })
    .refine((val) => val !== 0, 'amount tidak boleh 0'),
  category_id: z.string().uuid('category_id harus berupa UUID valid'),
  note: z.string().max(255, 'note maksimal 255 karakter').optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus format YYYY-MM-DD'),
});

const batchBodySchema = z.object({
  transactions: z
    .array(transactionItemSchema)
    .min(1, 'Minimal 1 transaksi')
    .max(MAX_ITEMS, `Maksimal ${MAX_ITEMS} transaksi per request`),
});

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit: 5 req per menit (lebih ketat, ini bulk operation) ─────────
    const ip = getClientIp(request);
    const rl = rateLimit(`transactions-batch:${user.id}:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
        { status: 429 }
      );
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const json = await request.json();
    const parsed = batchBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { transactions } = parsed.data;

    // ── Bulk insert to Supabase ───────────────────────────────────────────────
    const dataToInsert = transactions.map((t) => ({
      user_id: user.id,
      amount: t.amount,
      category_id: t.category_id,
      note: t.note ?? '',
      date: t.date,
      created_at: new Date().toISOString(),
    }));

    const { data, error: dbError } = await supabase
      .from('transactions')
      .insert(dataToInsert)
      .select('id');

    if (dbError) {
      console.error('[/api/transactions/batch] DB error:', dbError);
      return NextResponse.json(
        { error: 'Gagal menyimpan transaksi', message: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: data?.length ?? 0 }, { status: 201 });
  } catch (error) {
    console.error('[/api/transactions/batch] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
