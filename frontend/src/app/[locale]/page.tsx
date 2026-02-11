import { Link } from '@/i18n/navigation';
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/features/projects/ui/ProjectCard";
import { TestimonialsSection } from "@/features/testimonials/ui/TestimonialsSection";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localizeProject } from '@/lib/localize';

const tech = ["Next.js", "React", "TypeScript", "Go", "PostgreSQL", "Docker"];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFeaturedProjects() {
  try {
    return await prisma.project.findMany({
      where: {
        published: true,
        featured: true,
      },
      orderBy: [
        { order: 'asc' },
        { publishedAt: 'desc' },
      ],
      take: 3,
    });
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return [];
  }
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const featuredProjects = await getFeaturedProjects();
  const t = await getTranslations('home');

  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-sm shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-muted-foreground">{t('available')}</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                {t.rich('greeting', {
                  name: (chunks) => (
                    <span className="bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>

              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                {t('tagline')}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/projects">
                    {t('viewWork')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl">
                  <Link href="/contact">{t('getInTouch')}</Link>
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button variant="ghost" size="icon" asChild className="rounded-2xl">
                  <a href="https://github.com/isaacwallace123" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                    <Github className="h-5 w-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild className="rounded-2xl">
                  <a href="https://linkedin.com/in/isaac-wallace" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild className="rounded-2xl">
                  <a href="mailto:isaac.wallace.work@gmail.com" aria-label="Email">
                    <Mail className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative md:justify-self-center">
              <div className="absolute -inset-2 rounded-3xl bg-linear-to-b from-primary/20 to-transparent blur-2xl" />
              <div className="relative rounded-3xl border bg-background/80 dark:bg-background/60 p-6 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-muted-foreground">{t('techShipWith')}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tech.map((item) => (
                    <span key={item} className="rounded-full border bg-muted/40 px-3 py-1 text-sm text-foreground/80">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">{t('currentlyBuilding')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t('currentlyBuildingDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredProjects.length > 0 && (
        <section className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t('featured')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  {t('projectsWorthClicking')}
                </h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href="/projects">
                  {t('seeAll')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={localizeProject(project, locale)} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      <TestimonialsSection />
    </main>
  );
}
