import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProjectContent } from '@/features/projects/ui/ProjectContent';
import { PageTreeNavigation } from '@/features/projects/ui/PageTreeNavigation';
import { buildPageTree } from '@/features/projects/lib/buildPageTree';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localizeProject, localizeProjectPage } from '@/lib/localize';

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
  const t = await getTranslations('projects');

  if (!data) {
    notFound();
  }

  const project = localizeProject(data.project, locale);
  const page = localizeProjectPage(data.page, locale);
  const allPages = data.allPages.map((p) => localizeProjectPage(p, locale));
  const connectedPages = page.outgoingConnections
    ? page.outgoingConnections.map(connection => connection.targetPage).filter(Boolean)
    : [];
  const pageTree = buildPageTree(allPages);
  const hasPageTree = pageTree.length > 1;

  return (
    <main className="relative flex-1">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">

        {/* Back to overview */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="rounded-2xl -ml-4">
            <Link href={`/projects/${project.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {project.title}
            </Link>
          </Button>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
        </div>

        {/* Main content + optional page tree sidebar */}
        <div className={hasPageTree ? 'grid gap-8 lg:grid-cols-[1fr_220px]' : 'space-y-8'}>
          <div className="space-y-8 min-w-0">
            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardContent className="p-8">
                <ProjectContent content={page.content} />
              </CardContent>
            </Card>

            {/* Page tree nav on mobile */}
            {hasPageTree && (
              <Card className="bg-background/80 backdrop-blur dark:bg-background/60 lg:hidden">
                <CardContent className="pt-6 pb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('pages')}
                  </h3>
                  <PageTreeNavigation pageTree={pageTree} currentPageId={page.id} projectSlug={project.slug} />
                </CardContent>
              </Card>
            )}

            {/* Continue reading */}
            {connectedPages.length > 0 && (
              <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold mb-4">{t('continueReading')}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {connectedPages.map((connectedPage) => (
                      <Link key={connectedPage.id} href={`/projects/${project.slug}/${connectedPage.slug}`} className="group">
                        <Card className="transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{connectedPage.title}</h4>
                                <Badge variant="outline" className="mt-2 text-xs">/{connectedPage.slug}</Badge>
                              </div>
                              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1 rotate-180" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Page tree sidebar on desktop */}
          {hasPageTree && (
            <aside className="hidden lg:block">
              <div className="sticky top-8 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t('pages')}
                </h3>
                <PageTreeNavigation pageTree={pageTree} currentPageId={page.id} projectSlug={project.slug} />
              </div>
            </aside>
          )}
        </div>

      </div>
    </main>
  );
}
