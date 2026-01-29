import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/features/projects/ui/ProjectCard";

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

export default async function HomePage() {
  const featuredProjects = await getFeaturedProjects();

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
                <span className="text-muted-foreground">Available for opportunities</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Hi, I'm{" "}
                <span className="bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Isaac Wallace
                </span>
                .
              </h1>

              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Full-stack developer building scalable, elegant products with a strong focus on
                performance, clean architecture, and great UX.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/projects">
                    View My Work <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl">
                  <Link href="/contact">Get In Touch</Link>
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button variant="ghost" size="icon" asChild className="rounded-2xl">
                  <a
                    href="https://github.com/isaacwallace123"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild className="rounded-2xl">
                  <a
                    href="https://linkedin.com/in/isaac-wallace"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
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
                <p className="text-sm font-medium text-muted-foreground">Tech I ship with</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border bg-muted/40 px-3 py-1 text-sm text-foreground/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Currently building</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A scalable portfolio with an admin panel + auth, designed to grow into a full
                    platform.
                  </p>
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
                  Featured
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  Projects worth clicking
                </h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href="/projects">
                  See all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} featured />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}