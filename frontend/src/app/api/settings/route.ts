import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SENSITIVE_KEYS = ['github_token'];

function maskValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.includes(key) || !value) return value;
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

// GET — admin only, returns all settings as Record<string, string>
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = maskValue(row.key, row.value);
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

// PUT — admin only, upsert a single setting
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = updateSchema.parse(body);

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      );
    }
    console.error('Failed to update setting:', err);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
