import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3, BUCKET } from '@/shared/lib/s3';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (segments.some((s) => s === '..' || s.includes('\\') || s.includes('\0'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const key = segments.join('/');

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const stream = obj.Body?.transformToWebStream();
    if (!stream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filename = segments[segments.length - 1];
    const ext = extname(filename).toLowerCase();
    const contentType = obj.ContentType ?? MIME_TYPES[ext] ?? 'application/octet-stream';

    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
