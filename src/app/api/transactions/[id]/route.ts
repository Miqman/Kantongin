import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15+ convention for params
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let finalUserId = user?.id;
    if (!finalUserId && process.env.NODE_ENV === 'development') {
      finalUserId = 'dummy-user-id-1';
    } else if (authError || !finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure transaction belongs to user before deleting
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id, 
        user_id: finalUserId 
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Transaction Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
