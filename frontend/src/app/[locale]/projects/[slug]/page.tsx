import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Github, ExternalLink, Calendar } from 'lucide-react';
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
import { LanguageIcon } from '@/features/github/ui/LanguageIcon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProjectPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

async function getProject(projectSlug: string) {
  if (!projectSlug) return null;

  try {
    const [project, skills] = await Promise.all([
      prisma.project.findUnique({
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
      }),
      prisma.skill.findMany({ select: { label: true, icon: true } }),
    ]);

    if (!project) return null;

    const skillIconMap = new Map<string, string>();
    for (const s of skills) skillIconMap.set(s.label.toLowerCase(), s.icon);

    const startPage = project.pages.find(p => p.isStartPage);
    return { project, startPage, allPages: project.pages, skillIconMap };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { locale, slug } = await params;
  const data = await getProject(slug);
  const t = await getTranslations({ locale, namespace: 'projects' });

  if (!data) {
    return { title: t('projectNotFound') };
  }

  const localized = localizeProject(data.project, locale);
  return {
    title: `${localized.title} - Isaac Wallace`,
    description: localized.description || localized.excerpt || '',
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getProject(slug);
  const t = await getTranslations('projects');

  if (!data) {
    notFound();
  }

  const project = localizeProject(data.project, locale);
  const startPage = data.startPage ? localizeProjectPage(data.startPage, locale) : null;
  const allPages = data.allPages.map((p) => localizeProjectPage(p, locale));
  const skillIconMap = data.skillIconMap;
  const content = startPage?.content || project.content || '';
  const pageTree = buildPageTree(allPages);
  const hasSubPages = pageTree.length > 1;
  const dateFmtLocale = locale === 'fr' ? 'fr-CA' : 'en-US';

  // Extract TOC items from page content
  const blocks = parseBlocks(content);
  const tocItems = blocks ? extractTocItems(blocks) : [];
  const hasToc = tocItems.length > 0;

  const gridClass = cn(
    'grid gap-10',
    hasSubPages && hasToc ? 'lg:grid-cols-[180px_1fr_220px]' :
    hasSubPages           ? 'lg:grid-cols-[180px_1fr]' :
    hasToc                ? 'lg:grid-cols-[1fr_220px]' : ''
  );

  return (
    <main className="relative flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">

        {/* Back to projects */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/projects">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('backToProjects')}
            </Link>
          </Button>
        </div>

        <div className={gridClass}>

          {/* LEFT — page navigation */}
          {hasSubPages && (
            <aside className="hidden lg:block">
              <div className="sticky top-18">
                <PageTreeNavigation
                  pageTree={pageTree}
                  currentPageId={startPage?.id}
                  projectSlug={project.slug}
                  projectTitle={project.title}
                />
              </div>
            </aside>
          )}

          {/* CENTER — project metadata + content */}
          <div className="min-w-0 space-y-8">

            {/* Hero thumbnail */}
            {project.thumbnail && (
              <div className="aspect-video w-full overflow-hidden rounded-2xl border bg-muted">
                <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover" />
              </div>
            )}

            {/* Project header */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
                {(project.liveUrl || project.githubUrl) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {project.liveUrl && (
                      <Button asChild size="sm" className="rounded-2xl">
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          {t('viewLive')}
                        </a>
                      </Button>
                    )}
                    {project.githubUrl && (
                      <Button asChild variant="outline" size="sm" className="rounded-2xl">
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-2 h-3 w-3" />
                          {t('viewCode')}
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {project.startDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString(dateFmtLocale, { month: 'short', year: 'numeric' })}
                      {project.endDate
                        ? ` – ${new Date(project.endDate).toLocaleDateString(dateFmtLocale, { month: 'short', year: 'numeric' })}`
                        : ` – ${t('present')}`
                      }
                    </span>
                  </div>
                )}
              </div>

              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                    {t('techStack')}
                  </span>
                  {project.technologies.map((tech) => {
                    const iconUrl = skillIconMap.get(tech.toLowerCase());
                    return (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="rounded-lg text-xs pl-1.5 pr-2.5 py-1 gap-1.5 inline-flex items-center border border-border/40 bg-background/60 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        {iconUrl
                          ? <Image src={iconUrl} alt="" width={13} height={13} className="shrink-0" />
                          : <LanguageIcon name={tech} size={13} />
                        }
                        {tech}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Page content */}
            {content && <ProjectContent content={content} />}

            {/* Bottom pagination */}
            {hasSubPages && (
              <PagePagination
                pageTree={pageTree}
                currentPageId={startPage?.id}
                projectSlug={project.slug}
              />
            )}

            {/* Mobile page nav */}
            {hasSubPages && (
              <div className="lg:hidden border-t pt-6">
                <PageTreeNavigation
                  pageTree={pageTree}
                  currentPageId={startPage?.id}
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
