import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — public endpoint, returns CV metadata if visible
export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en';

    // Validate locale
    if (locale !== 'en' && locale !== 'fr') {
      return NextResponse.json(null);
    }

    const prefix = `cv_${locale}`;
    const keys = [
      `${prefix}_file_path`,
      `${prefix}_file_name`,
      `${prefix}_file_size`,
      `${prefix}_upload_date`,
      `${prefix}_visible`,
    ];

    const rows = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const data: Record<string, string> = {};
    for (const row of rows) {
      const key = row.key.replace(`${prefix}_`, '');
      data[key] = row.value;
    }

    // Only return if CV exists and is visible
    if (!data.file_path || data.visible !== 'true') {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      filePath: data.file_path,
      fileName: data.file_name || 'resume.pdf',
      fileSize: parseInt(data.file_size || '0', 10),
      uploadDate: data.upload_date || new Date().toISOString(),
      visible: true,
    });
  } catch (error) {
    console.error('Failed to fetch CV metadata:', error);
    return NextResponse.json(null);
  }
}
