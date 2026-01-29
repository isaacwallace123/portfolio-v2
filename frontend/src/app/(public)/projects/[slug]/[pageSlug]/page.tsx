import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProjectContent } from '@/features/projects/ui/ProjectContent';
import { PageNavigation } from '@/features/projects/ui/PageNavigation';
import { PageBreadcrumbs } from '@/features/projects/ui/PageBreadcrumbs';

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

    return { project, page };
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

  const { project, page } = data;
  
  // Extract connected pages from outgoing connections and cast to ProjectPage[]
  const connectedPages: any[] = page.outgoingConnections
    ? page.outgoingConnections.map(connection => connection.targetPage).filter(Boolean)
    : [];

  return (
    <main className="relative flex-1">
      {/* Header */}
      <section className="border-b">
        <div className="mx-auto w-full max-w-4xl px-4 py-12">
          <div className="mb-8">
            <Button asChild variant="ghost" className="rounded-2xl -ml-4">
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          </div>

          <PageBreadcrumbs project={project as any} currentPage={page as any} />

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              {page.isStartPage && (
                <Badge variant="secondary" className="mb-2">
                  Start Page
                </Badge>
              )}
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {page.title}
              </h1>
            </div>

            {/* Project Meta Info - only on start page */}
            {page.isStartPage && (
              <>
                {project.description && (
                  <p className="text-xl text-muted-foreground">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                  {project.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.startDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                        {project.endDate && (
                          <> - {new Date(project.endDate).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}</>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {project.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Published {new Date(project.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Thumbnail - only on start page */}
      {page.isStartPage && project.thumbnail && (
        <section className="border-b">
          <div className="mx-auto w-full max-w-4xl px-4 py-8">
            <div className="aspect-video w-full overflow-hidden rounded-3xl border bg-muted">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Technologies - only on start page */}
      {page.isStartPage && project.technologies && project.technologies.length > 0 && (
        <section className="border-b">
          <div className="mx-auto w-full max-w-4xl px-4 py-8">
            <h2 className="text-lg font-semibold mb-4">Technologies Used</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="outline" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto w-full max-w-4xl px-4 space-y-8">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardContent className="pt-8">
              <ProjectContent content={page.content} />
            </CardContent>
          </Card>

          {/* Navigation to connected pages */}
          {connectedPages.length > 0 && (
            <PageNavigation
              projectSlug={project.slug}
              currentPage={page as any}
              connectedPages={connectedPages as any}
            />
          )}
        </div>
      </section>

      {/* Back to Projects */}
      <section className="py-8 border-t">
        <div className="mx-auto w-full max-w-4xl px-4">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Projects
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}