import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
};

const ALL_ALLOWED = [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    const targetDir = folder ? join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    await mkdir(targetDir, { recursive: true });

    const entries = await readdir(targetDir);
    const files = await Promise.all(
      entries
        .filter((name) => !name.startsWith('.') && !name.startsWith('_'))
        .map(async (name) => {
          const filePath = join(targetDir, name);
          const stats = await stat(filePath);
          if (!stats.isFile()) return null;
          const urlPath = folder ? `/api/uploads/${folder}/${name}` : `/api/uploads/${name}`;
          return {
            name,
            url: urlPath,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          };
        })
    );

    return NextResponse.json(
      files.filter(Boolean).sort((a, b) =>
        new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )
    );
  } catch (error) {
    console.error('Error listing uploads:', error);
    return NextResponse.json(
      { error: 'Failed to list uploads' },
      { status: 500 }
    );
  }
}

// Allowed subfolders for uploads
const ALLOWED_FOLDERS = ['icons', 'cv_en', 'cv_fr'];

// POST — upload a file (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    // Validate folder if provided
    if (folder && !ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: `Invalid folder "${folder}". Allowed: ${ALLOWED_FOLDERS.join(', ')}` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALL_ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed. Allowed: images (JPEG, PNG, WebP, GIF, SVG) and documents (PDF, DOC, DOCX, TXT).` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const targetDir = folder ? join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    await mkdir(targetDir, { recursive: true });

    const ext = extname(file.name) || getExtension(file.type);
    // For icons folder, use sanitized original name; UUID for everything else
    const baseName = folder === 'icons'
      ? file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
      : randomUUID();
    const filename = `${baseName}${ext}`;
    const filepath = join(targetDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const urlPath = folder ? `/api/uploads/${folder}/${filename}` : `/api/uploads/${filename}`;

    return NextResponse.json(
      {
        name: filename,
        originalName: file.name,
        url: urlPath,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE — remove an uploaded file (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    // Prevent path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      );
    }

    const filepath = join(UPLOAD_DIR, name);
    await unlink(filepath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
