import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const connectionSchema = z.object({
  sourcePageId: z.string(),
  targetPageId: z.string(),
  label: z.string().optional(),
});

// GET - Get all connections for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const connections = await prisma.pageConnection.findMany({
      where: {
        sourcePage: {
          projectId,
        },
      },
      include: {
        sourcePage: true,
        targetPage: true,
      },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST - Create new connection
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validatedData = connectionSchema.parse(body);

    // Check if connection already exists
    const existing = await prisma.pageConnection.findFirst({
      where: {
        sourcePageId: validatedData.sourcePageId,
        targetPageId: validatedData.targetPageId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Connection already exists' },
        { status: 400 }
      );
    }

    const connection = await prisma.pageConnection.create({
      data: validatedData,
      include: {
        sourcePage: true,
        targetPage: true,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}

// PUT - Update connection
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    const validatedData = connectionSchema.partial().parse(data);

    const connection = await prisma.pageConnection.update({
      where: { id },
      data: validatedData,
      include: {
        sourcePage: true,
        targetPage: true,
      },
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    await prisma.pageConnection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}