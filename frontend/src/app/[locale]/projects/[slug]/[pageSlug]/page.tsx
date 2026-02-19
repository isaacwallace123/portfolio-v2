import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectContent } from '@/features/projects/ui/ProjectContent';
import { PageTreeNavigation } from '@/features/projects/ui/PageTreeNavigation';
import { TableOfContents } from '@/features/projects/ui/TableOfContents';
import { PagePagination } from '@/features/projects/ui/PagePagination';
import { buildPageTree } from '@/features/projects/lib/buildPageTree';
import { parseBlocks } from '@/features/projects/lib/blocks';
import { extractTocItems } from '@/features/projects/lib/toc';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localizeProject, localizeProjectPage } from '@/lib/localize';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageViewProps {
  params: Promise<{
    locale: string;
    slug: string;
    pageSlug: string;
  }>;
}

async function getProjectPage(projectSlug: string, pageSlug: string) {
  if (!projectSlug || !pageSlug) return null;

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug, published: true },
      include: {
        pages: {
          include: {
            outgoingConnections: {
              include: { targetPage: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) return null;

    const page = await prisma.projectPage.findUnique({
      where: {
        projectId_slug: {
          projectId: project.id,
          slug: pageSlug,
        },
      },
      include: {
        outgoingConnections: {
          include: { targetPage: true },
        },
      },
    });

    if (!page) return null;

    return { project, page, allPages: project.pages };
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageViewProps) {
  const { locale, slug, pageSlug } = await params;
  const data = await getProjectPage(slug, pageSlug);
  const t = await getTranslations({ locale, namespace: 'projects' });

  if (!data) {
    return { title: t('pageNotFound') };
  }

  const localizedProject = localizeProject(data.project, locale);
  const localizedPage = localizeProjectPage(data.page, locale);
  return {
    title: `${localizedPage.title} - ${localizedProject.title}`,
    description: localizedProject.description || localizedProject.excerpt || '',
  };
}

export default async function PageView({ params }: PageViewProps) {
  const { locale, slug, pageSlug } = await params;
  setRequestLocale(locale);

  const data = await getProjectPage(slug, pageSlug);

  if (!data) {
    notFound();
  }

  const project = localizeProject(data.project, locale);
  const page = localizeProjectPage(data.page, locale);
  const allPages = data.allPages.map((p) => localizeProjectPage(p, locale));
  const pageTree = buildPageTree(allPages);
  const hasPageTree = pageTree.length > 1;

  // Extract TOC from this page's content
  const blocks = parseBlocks(page.content);
  const tocItems = blocks ? extractTocItems(blocks) : [];
  const hasToc = tocItems.length > 0;

  const gridClass = cn(
    'grid gap-10',
    hasPageTree && hasToc ? 'lg:grid-cols-[180px_1fr_160px]' :
    hasPageTree           ? 'lg:grid-cols-[180px_1fr]' :
    hasToc                ? 'lg:grid-cols-[1fr_160px]' : ''
  );

  return (
    <main className="relative flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">

        <div className={gridClass}>

          {/* LEFT — page navigation */}
          {hasPageTree && (
            <aside className="hidden lg:block">
              <div className="sticky top-18">
                <PageTreeNavigation
                  pageTree={pageTree}
                  currentPageId={page.id}
                  projectSlug={project.slug}
                  projectTitle={project.title}
                />
              </div>
            </aside>
          )}

          {/* CENTER — page title + content */}
          <div className="min-w-0 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>

            <ProjectContent content={page.content} />

            {/* Bottom pagination */}
            {hasPageTree && (
              <PagePagination
                pageTree={pageTree}
                currentPageId={page.id}
                projectSlug={project.slug}
              />
            )}

            {/* Mobile page nav */}
            {hasPageTree && (
              <div className="lg:hidden border-t pt-6">
                <PageTreeNavigation
                  pageTree={pageTree}
                  currentPageId={page.id}
                  projectSlug={project.slug}
                  projectTitle={project.title}
                />
              </div>
            )}
          </div>

          {/* RIGHT — table of contents */}
          {hasToc && (
            <aside className="hidden lg:block">
              <div className="sticky top-18">
                <TableOfContents items={tocItems} />
              </div>
            </aside>
          )}

        </div>
      </div>
    </main>
  );
}
