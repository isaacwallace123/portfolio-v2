import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
  ids: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = reorderSchema.parse(body);

    // Batch update in transaction
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.hobby.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error reordering hobbies:', error);
    return NextResponse.json(
      { error: 'Failed to reorder hobbies' },
      { status: 500 }
    );
  }
}
