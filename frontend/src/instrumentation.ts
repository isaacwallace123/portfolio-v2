/**
 * Next.js instrumentation hook — runs once on server startup (Node.js runtime only).
 * Seeds all files from public/uploads/icons/ into MinIO so the bucket stays in sync
 * with the icons committed to the repo.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Fire-and-forget so MinIO seeding doesn't block server startup
  seedIconsToMinio().catch(() => {});
}

async function seedIconsToMinio() {
  const { readdir, readFile } = await import('fs/promises');
  const { join, extname } = await import('path');
  const { HeadBucketCommand, CreateBucketCommand, HeadObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { s3, BUCKET } = await import('@/shared/lib/s3');

  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[seed] created bucket: ${BUCKET}`);
  }

  const MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const iconsDir = join(process.cwd(), 'public', 'uploads', 'icons');

  let files: string[];
  try {
    files = await readdir(iconsDir);
  } catch {
    return;
  }

  await Promise.allSettled(
    files.map(async (filename) => {
      const ext = extname(filename).toLowerCase();
      const contentType = MIME[ext];
      if (!contentType) return;

      const key = `icons/${filename}`;

      try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      } catch {
        try {
          const body = await readFile(join(iconsDir, filename));
          await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
          console.log(`[seed] uploaded icon: ${key}`);
        } catch (err) {
          console.warn(`[seed] failed to upload icon ${key}:`, err);
        }
      }
    })
  );
}
