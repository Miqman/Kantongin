import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      console.error('GET Budgets Error:', dbError);
      return NextResponse.json({ error: 'Gagal mengambil budget' }, { status: 500 });
    }

    return NextResponse.json(budgets ?? []);
  } catch (error) {
    console.error('GET Budgets Error:', error);
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
    const { category_id, limit_amount, period } = json;

    const { data: budget, error: dbError } = await supabase
      .from('budgets')
      .insert({ user_id: user.id, category_id: category_id ?? null, limit_amount, period: period ?? 'monthly' })
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      console.error('POST Budget Error:', dbError);
      return NextResponse.json({ error: 'Gagal menambah budget' }, { status: 500 });
    }

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('POST Budget Error:', error);
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
    const { id, limit_amount, category_id, period } = json;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data: budget, error: dbError } = await supabase
      .from('budgets')
      .update({ limit_amount, category_id: category_id ?? null, period: period ?? 'monthly' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, category:categories(*)`)
      .single();

    if (dbError) {
      console.error('PUT Budget Error:', dbError);
      return NextResponse.json({ error: 'Gagal update budget' }, { status: 500 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('PUT Budget Error:', error);
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
      console.error('DELETE Budget Error:', dbError);
      return NextResponse.json({ error: 'Gagal hapus budget' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Budget Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
