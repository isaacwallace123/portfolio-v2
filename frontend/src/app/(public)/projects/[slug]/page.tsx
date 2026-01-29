import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Github, ExternalLink, Calendar, Clock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ProjectContent } from '@/features/projects/ui/ProjectContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProject(slug: string) {
  if (!slug || slug === 'undefined') {
    return null;
  }

  try {
    return await prisma.project.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.title} - Isaac Wallace`,
    description: project.description || project.excerpt || 'Project details',
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.slug);

  if (!project || !project.published) {
    notFound();
  }

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

          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {project.title}
            </h1>

            {/* Description */}
            {project.description && (
              <p className="text-xl text-muted-foreground">
                {project.description}
              </p>
            )}

            {/* Meta Info */}
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {project.liveUrl && (
                <Button asChild className="rounded-2xl">
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button asChild variant="outline" className="rounded-2xl">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View Code
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Thumbnail */}
      {project.thumbnail && (
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

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
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
        <div className="mx-auto w-full max-w-4xl px-4">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
            <CardContent className="pt-8">
              <ProjectContent content={project.content} />
            </CardContent>
          </Card>
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