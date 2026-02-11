import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { join, basename } from 'path';

const ICONS_DIR = join(process.cwd(), 'public', 'uploads', 'icons');

// Uploaded icons get UUID filenames; default icons have readable names like "react.png"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i;

function isUploadedIcon(iconUrl: string): boolean {
  const filename = basename(iconUrl);
  return UUID_RE.test(filename);
}

async function tryDeleteIcon(iconUrl: string) {
  if (!iconUrl || !isUploadedIcon(iconUrl)) return;
  const filename = basename(iconUrl);
  try {
    await unlink(join(ICONS_DIR, filename));
  } catch {
    // File may already be gone — ignore
  }
}

const skillSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  icon: z.string().min(1, 'Icon path is required'),
  categoryId: z.string().min(1, 'Category is required'),
  order: z.number().optional(),
});

// GET is public — about page needs to read skills without auth
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        category: {
          select: { id: true, name: true, order: true },
        },
      },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }, { label: 'asc' }],
    });
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = skillSchema.parse(body);

    const skill = await prisma.skill.create({ data });
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    const validated = skillSchema.partial().parse(data);

    // If icon is changing, delete the old uploaded icon
    if (validated.icon) {
      const existing = await prisma.skill.findUnique({ where: { id }, select: { icon: true } });
      if (existing && existing.icon !== validated.icon) {
        await tryDeleteIcon(existing.icon);
      }
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating skill:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.findUnique({ where: { id }, select: { icon: true } });
    await prisma.skill.delete({ where: { id } });
    if (skill) await tryDeleteIcon(skill.icon);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
