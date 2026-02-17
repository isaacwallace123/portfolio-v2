import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const hobbySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  labelFr: z.string().optional(),
  icon: z.string().optional(),
});

const updateSchema = hobbySchema.partial();

// GET is public — fetches all hobbies for display
export async function GET() {
  try {
    const hobbies = await prisma.hobby.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(hobbies);
  } catch (error) {
    console.error('Error fetching hobbies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hobbies' },
      { status: 500 }
    );
  }
}

// POST is admin-only — create new hobby
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = hobbySchema.parse(body);

    // Get current max order
    const maxOrderHobby = await prisma.hobby.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderHobby?.order ?? -1) + 1;

    const hobby = await prisma.hobby.create({
      data: {
        ...data,
        order: nextOrder,
      },
    });

    return NextResponse.json(hobby, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating hobby:', error);
    return NextResponse.json(
      { error: 'Failed to create hobby' },
      { status: 500 }
    );
  }
}

// PUT is admin-only — update hobby
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Hobby ID is required' },
        { status: 400 }
      );
    }

    const validated = updateSchema.parse(data);

    const hobby = await prisma.hobby.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(hobby);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating hobby:', error);
    return NextResponse.json(
      { error: 'Failed to update hobby' },
      { status: 500 }
    );
  }
}

// DELETE is admin-only — delete hobby
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Hobby ID is required' },
        { status: 400 }
      );
    }

    await prisma.hobby.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hobby:', error);
    return NextResponse.json(
      { error: 'Failed to delete hobby' },
      { status: 500 }
    );
  }
}
