import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const budgetSchema = z.object({
  limit_amount: z.number().positive('limit_amount harus > 0'),
  period: z.enum(['monthly', 'weekly']).optional().default('monthly'),
  category_id: z.string().uuid().nullable().optional().default(null),
});

const budgetUpdateSchema = z.object({
  id: z.string().uuid('id harus berupa UUID valid'),
  limit_amount: z.number().positive('limit_amount harus > 0'),
  period: z.enum(['monthly', 'weekly']).optional().default('monthly'),
  category_id: z.string().uuid().nullable().optional().default(null),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: budgets, error: dbError } = await supabase
      .from('budgets')
      .select(`*, category:categories(*)`)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Gagal mengambil budget' }, { status: 500 });
    }

    return NextResponse.json(budgets ?? []);
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
    const parsed = budgetSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { limit_amount, period, category_id } = parsed.data;

    const { data: budget, error: dbError } = await supabase
      .from('budgets')
      .insert({ user_id: user.id, category_id, limit_amount, period })
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Gagal menambah budget' }, { status: 500 });
    }

    return NextResponse.json(budget, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = budgetUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, limit_amount, category_id, period } = parsed.data;

    const { data: budget, error: dbError } = await supabase
      .from('budgets')
      .update({ limit_amount, category_id, period })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Gagal update budget' }, { status: 500 });
    }

    return NextResponse.json(budget);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error: dbError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (dbError) {
      return NextResponse.json({ error: 'Gagal hapus budget' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
