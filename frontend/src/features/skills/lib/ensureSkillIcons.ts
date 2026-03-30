/**
 * Server-side only. For each label in the provided list:
 *   1. Check DB for an existing Skill with a matching label (case-insensitive).
 *   2. If found, return its stored icon URL.
 *   3. If NOT found and a devicon mapping exists, download the SVG from jsDelivr
 *      and upload it to MinIO, then create a Skill record.
 *
 * Returns a Record<lowercased-label, icon-url> for all labels that have an icon.
 */
import { prisma } from '@/lib/prisma';
import { getDeviconUrl } from '@/features/github/lib/languageUtils';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3, BUCKET } from '@/shared/lib/s3';

async function getOrCreateAutoCategory(): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { name: 'Other' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const agg = await prisma.category.aggregate({ _max: { order: true } });
  const cat = await prisma.category.create({
    data: { name: 'Other', order: (agg._max.order ?? 0) + 1 },
  });
  return cat.id;
}

export async function ensureSkillIcons(
  labels: string[]
): Promise<Record<string, string>> {
  if (labels.length === 0) return {};

  const existing = await prisma.skill.findMany({
    where: { label: { in: labels, mode: 'insensitive' } },
    select: { label: true, icon: true },
  });

  const result: Record<string, string> = {};
  const found = new Set<string>();

  for (const s of existing) {
    const key = s.label.toLowerCase();
    result[key] = s.icon;
    found.add(key);
  }

  const missing = labels.filter((l) => !found.has(l.toLowerCase()));
  if (missing.length === 0) return result;

  const categoryId = await getOrCreateAutoCategory();

  await Promise.allSettled(
    missing.map(async (originalLabel) => {
      const key = originalLabel.toLowerCase();
      const remoteUrl = getDeviconUrl(key);
      if (!remoteUrl) return;

      const safeName = key.replace(/[^a-z0-9]/g, '-');
      const filename = `${safeName}.svg`;
      const s3Key = `icons/${filename}`;
      const iconUrl = `/api/uploads/${s3Key}`;

      try {
        // Only upload if not already in MinIO
        let exists = false;
        try {
          await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: s3Key }));
          exists = true;
        } catch {
          exists = false;
        }

        if (!exists) {
          const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) return;
          const svg = await res.text();
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            Body: svg,
            ContentType: 'image/svg+xml',
          }));
        }

        await prisma.skill.create({
          data: { label: originalLabel, icon: iconUrl, categoryId, order: 0 },
        });

        result[key] = iconUrl;
      } catch (err) {
        console.warn(`[ensureSkillIcons] Could not auto-create icon for "${originalLabel}":`, err);
      }
    })
  );

  return result;
}
