/**
 * Server-side only. For each label in the provided list:
 *   1. Check DB for an existing Skill with a matching label (case-insensitive).
 *   2. If found, return its stored (local) icon URL.
 *   3. If NOT found and a devicon mapping exists, download the SVG from jsDelivr
 *      once, write it to public/uploads/icons/, and create a Skill record so every
 *      future request uses the local copy.
 *
 * Returns a Record<lowercased-label, icon-url> for all labels that have an icon.
 */
import { prisma } from '@/lib/prisma';
import { getDeviconUrl } from '@/features/github/lib/languageUtils';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

const ICONS_DIR = join(process.cwd(), 'public', 'uploads', 'icons');

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

  // Fetch all existing skills whose label matches any of the given labels
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

  await mkdir(ICONS_DIR, { recursive: true });
  const categoryId = await getOrCreateAutoCategory();

  await Promise.allSettled(
    missing.map(async (originalLabel) => {
      const key = originalLabel.toLowerCase();
      const remoteUrl = getDeviconUrl(key);
      if (!remoteUrl) return; // No devicon mapping for this tech — skip

      const safeName = key.replace(/[^a-z0-9]/g, '-');
      const filename = `${safeName}.svg`;
      const filepath = join(ICONS_DIR, filename);
      const iconUrl = `/api/uploads/icons/${filename}`;

      try {
        // Only download if the file is not already on disk
        let fileExists = false;
        try {
          await access(filepath);
          fileExists = true;
        } catch {
          fileExists = false;
        }

        if (!fileExists) {
          const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) return;
          const svg = await res.text();
          await writeFile(filepath, svg, 'utf8');
        }

        // Create the skill record (best-effort — ignore duplicate label conflicts)
        await prisma.skill.create({
          data: { label: originalLabel, icon: iconUrl, categoryId, order: 0 },
        });

        result[key] = iconUrl;
      } catch (err) {
        // Non-fatal: the tech will fall back to a colored dot on first render
        console.warn(`[ensureSkillIcons] Could not auto-create icon for "${originalLabel}":`, err);
      }
    })
  );

  return result;
}
