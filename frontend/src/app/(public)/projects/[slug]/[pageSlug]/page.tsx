import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Github, ExternalLink, Calendar, Clock, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProjectContent } from '@/features/projects/ui/ProjectContent';
import { PageTreeNavigation } from '@/features/projects/ui/PageTreeNavigation';
import { buildPageTree } from '@/features/projects/lib/buildPageTree';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageViewProps {
  params: Promise<{
    slug: string;
    pageSlug: string;
  }>;
}

async function getProjectPage(projectSlug: string, pageSlug: string) {
  if (!projectSlug || !pageSlug) {
    return null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug, published: true },
      include: {
        pages: {
          include: {
            outgoingConnections: {
              include: {
                targetPage: true,
              },
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
          include: {
            targetPage: true,
          },
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
  const resolvedParams = await params;
  const data = await getProjectPage(resolvedParams.slug, resolvedParams.pageSlug);

  if (!data) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: `${data.page.title} - ${data.project.title}`,
    description: data.project.description || data.project.excerpt || 'Project page',
  };
}

export default async function PageView({ params }: PageViewProps) {
  const resolvedParams = await params;
  const data = await getProjectPage(resolvedParams.slug, resolvedParams.pageSlug);

  if (!data) {
    notFound();
  }

  const { project, page, allPages } = data;
  
  const connectedPages = page.outgoingConnections
    ? page.outgoingConnections.map(connection => connection.targetPage).filter(Boolean)
    : [];

  // Build hierarchical page tree
  const pageTree = buildPageTree(allPages);

  return (
    <main className="relative flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="rounded-2xl -ml-4">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="bg-background/80 backdrop-blur dark:bg-background/60 sticky top-8">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Link href={`/projects/${project.slug}`} className="hover:underline">
                    <h2 className="text-xl font-bold mb-2">{project.title}</h2>
                  </Link>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>
                  )}
                </div>

                {project.technologies && project.technologies.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(project.liveUrl || project.githubUrl) && (
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    {project.liveUrl && (
                      <Button asChild size="sm" className="w-full rounded-2xl">
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View Live
                        </a>
                      </Button>
                    )}
                    {project.githubUrl && (
                      <Button asChild variant="outline" size="sm" className="w-full rounded-2xl">
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-2 h-3 w-3" />
                          View Code
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Collapsible Pages Navigation */}
                {pageTree.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pages
                    </h3>
                    <PageTreeNavigation
                      pageTree={pageTree}
                      currentPageId={page.id}
                      projectSlug={project.slug}
                    />
                  </div>
                )}

                <div className="border-t pt-6 space-y-3 text-xs text-muted-foreground">
                  {project.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(project.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                        {project.endDate ? (
                          <> - {new Date(project.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}</>
                        ) : (
                          <> - Present</>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {project.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Published {new Date(project.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-8 min-w-0">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                  {page.title}
                </h1>
              </div>
            </div>

            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardContent className="pt-8">
                <ProjectContent content={page.content} />
              </CardContent>
            </Card>

            {connectedPages.length > 0 && (
              <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Continue Reading</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {connectedPages.map((connectedPage) => (
                      <Link
                        key={connectedPage.id}
                        href={`/projects/${project.slug}/${connectedPage.slug}`}
                        className="group"
                      >
                        <Card className="transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                  {connectedPage.title}
                                </h4>
                                <Badge variant="outline" className="mt-2 text-xs">
                                  /{connectedPage.slug}
                                </Badge>
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

            <div className="flex justify-center pt-4">
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href={`/projects/${project.slug}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Overview
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}