import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';
import { translateBlocks, translateFields, hasBrokenEntities } from '@/lib/deepl';
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

  // ── Project-level plain text fields ────────────────────────────────────────
  // Re-translate if missing OR if the stored value has HTML-encoded entities (e.g. &#x27;)
  const projectPlain: Record<string, string | null | undefined> = {};
  if ((!project.titleFr       || hasBrokenEntities(project.titleFr))       && project.title)       projectPlain.title       = project.title;
  if ((!project.descriptionFr || hasBrokenEntities(project.descriptionFr)) && project.description) projectPlain.description = project.description;
  if ((!project.excerptFr     || hasBrokenEntities(project.excerptFr))     && project.excerpt)     projectPlain.excerpt     = project.excerpt;

  const contentBlocks = project.content ? parseBlocks(project.content) : null;
  const needsContentTranslation = contentBlocks && !project.contentFr;

  // ── Run project-level translations in parallel ──────────────────────────────
  const [translatedFields, translatedContentBlocks] = await Promise.all([
    Object.keys(projectPlain).length > 0 ? translateFields(projectPlain) : Promise.resolve({}),
    needsContentTranslation ? translateBlocks(contentBlocks!) : Promise.resolve(null),
  ]);

  const projectUpdate: Record<string, string> = { ...translatedFields };
  if (translatedContentBlocks) projectUpdate.contentFr = serializeBlocks(translatedContentBlocks);

  const fieldsTranslated = Object.keys(projectUpdate).length;

  if (fieldsTranslated > 0) {
    await prisma.project.update({ where: { id: projectId }, data: projectUpdate });
  }

  // ── Pages — all in parallel ─────────────────────────────────────────────────
  const pageResults = await Promise.all(
    project.pages.map(async (page) => {
      const pageUpdate: Record<string, string> = {};

      const pageBlocks = page.content ? parseBlocks(page.content) : null;
      const needsPageContent = pageBlocks && !page.contentFr;

      const [translatedTitle, translatedPageBlocks] = await Promise.all([
        ((!page.titleFr || hasBrokenEntities(page.titleFr)) && page.title) ? translateFields({ title: page.title }) : Promise.resolve({}),
        needsPageContent ? translateBlocks(pageBlocks!) : Promise.resolve(null),
      ]);

      if (translatedTitle.titleFr) pageUpdate.titleFr = translatedTitle.titleFr;
      if (translatedPageBlocks)    pageUpdate.contentFr = serializeBlocks(translatedPageBlocks);

      if (Object.keys(pageUpdate).length > 0) {
        await prisma.projectPage.update({ where: { id: page.id }, data: pageUpdate });
        return true;
      }
      return false;
    })
  );

  const pagesTranslated = pageResults.filter(Boolean).length;

  return NextResponse.json({ success: true, fieldsTranslated, pagesTranslated });
}
