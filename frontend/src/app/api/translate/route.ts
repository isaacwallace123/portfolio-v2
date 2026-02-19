import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { translateBlocks, translateFields } from '@/lib/deepl';
import { parseBlocks, serializeBlocks } from '@/features/projects/lib/blocks';

// POST /api/translate  { projectId }
// Finds every untranslated or broken field and translates it via DeepL.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { pages: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  let fieldsTranslated = 0;
  let pagesTranslated = 0;

  // ── Project-level plain text fields ────────────────────────────────────────
  const projectPlain: Record<string, string | null | undefined> = {};
  if (!project.titleFr       && project.title)       projectPlain.title       = project.title;
  if (!project.descriptionFr && project.description) projectPlain.description = project.description;
  if (!project.excerptFr     && project.excerpt)     projectPlain.excerpt     = project.excerpt;

  // ── Project-level content (blocks) ─────────────────────────────────────────
  const projectUpdate: Record<string, string> = {};

  if (Object.keys(projectPlain).length > 0) {
    const translated = await translateFields(projectPlain);
    Object.assign(projectUpdate, translated);
    fieldsTranslated += Object.keys(translated).length;
  }

  // Translate project content only if missing or corrupted
  if (project.content) {
    const blocks = parseBlocks(project.content);
    const frBlocks = project.contentFr ? parseBlocks(project.contentFr) : null;
    const needsContentTranslation = blocks && !frBlocks; // missing or corrupted

    if (needsContentTranslation) {
      const translated = await translateBlocks(blocks!);
      projectUpdate.contentFr = serializeBlocks(translated);
      fieldsTranslated++;
    }
  }

  if (Object.keys(projectUpdate).length > 0) {
    await prisma.project.update({ where: { id: projectId }, data: projectUpdate });
  }

  // ── Pages ───────────────────────────────────────────────────────────────────
  for (const page of project.pages) {
    const pageUpdate: Record<string, string> = {};

    if (!page.titleFr && page.title) {
      const translated = await translateFields({ title: page.title });
      if (translated.titleFr) pageUpdate.titleFr = translated.titleFr;
    }

    if (page.content) {
      const blocks = parseBlocks(page.content);
      const frBlocks = page.contentFr ? parseBlocks(page.contentFr) : null;
      const needsContentTranslation = blocks && !frBlocks;

      if (needsContentTranslation) {
        const translated = await translateBlocks(blocks!);
        pageUpdate.contentFr = serializeBlocks(translated);
      }
    }

    if (Object.keys(pageUpdate).length > 0) {
      await prisma.projectPage.update({ where: { id: page.id }, data: pageUpdate });
      pagesTranslated++;
    }
  }

  return NextResponse.json({ success: true, fieldsTranslated, pagesTranslated });
}
