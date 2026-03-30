import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, BUCKET } from '@/shared/lib/s3';
import { checkRateLimit, RATE_LIMITS } from '@/shared/lib/rate-limiter';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_SIZE = 2 * 1024 * 1024; // 2MB for public uploads

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimeType] || '.bin';
}

// POST — public image upload (for testimonial avatars)
export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.IMAGE_UPLOAD, 'upload');
    if (rateLimit.limited) return rateLimit.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    const ext = extname(file.name) || getExtension(file.type);
    const filename = `${randomUUID()}${ext}`;
    const key = `testimonials/${filename}`;

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
