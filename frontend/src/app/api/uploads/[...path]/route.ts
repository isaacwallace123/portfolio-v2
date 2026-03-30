import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3, BUCKET } from '@/shared/lib/s3';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

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
  try {
    const { path: segments } = await params;

    if (segments.some((s) => s === '..' || s.includes('\\') || s.includes('\0'))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const key = segments.join('/');

    // Try S3 first
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const body = await obj.Body?.transformToByteArray();
      if (body) {
        const filename = segments[segments.length - 1];
        const ext = extname(filename).toLowerCase();
        const contentType = obj.ContentType ?? MIME_TYPES[ext] ?? 'application/octet-stream';
        return new NextResponse(body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch {
      // Fall through to filesystem fallback
    }

    // Fallback: serve from NFS filesystem (for files uploaded before MinIO migration)
    const filepath = join(UPLOAD_DIR, ...segments);
    try {
      const s = await stat(filepath);
      if (!s.isFile()) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = await readFile(filepath);
    const filename = segments[segments.length - 1];
    const ext = extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
