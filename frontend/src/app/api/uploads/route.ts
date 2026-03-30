import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { s3, BUCKET } from '@/shared/lib/s3';

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
};

const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FOLDERS = ['icons', 'cv_en', 'cv_fr', 'experience'];

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
  };
  return map[mimeType] || '.bin';
}

// GET — list uploaded files (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (folder && !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: `Invalid folder "${folder}"` },
        { status: 400 }
      );
    }

    const result = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folder ? `${folder}/` : undefined,
      MaxKeys: 1000,
    }));

    const files = (result.Contents ?? [])
      .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
      .map((obj) => {
        const key = obj.Key!;
        const parts = key.split('/');
        const name = parts[parts.length - 1];
        const fileFolder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        return {
          key,
          name,
          folder: fileFolder,
          url: `/api/uploads/${key}`,
          size: obj.Size ?? 0,
          createdAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing uploads:', error);
    return NextResponse.json({ error: 'Failed to list uploads' }, { status: 500 });
  }
}

// POST — upload a file (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (folder && !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: `Invalid folder "${folder}". Allowed: ${ALLOWED_FOLDERS.join(', ')}` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALL_ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const ext = extname(file.name) || getExtension(file.type);
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || randomUUID();
    const filename = `${baseName}${ext}`;
    const key = folder ? `${folder}/${filename}` : filename;

    const buffer = Buffer.from(await file.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    return NextResponse.json(
      {
        key,
        name: filename,
        originalName: file.name,
        url: `/api/uploads/${key}`,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE — remove a file by its S3 key (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    if (key.includes('..') || key.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
