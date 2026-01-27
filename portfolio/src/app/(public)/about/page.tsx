import Link from "next/link";
import { Header } from "@/widgets/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench } from "lucide-react";

const highlights = [
  {
    title: "Clean architecture",
    description: "I care about maintainable code: clear boundaries, good naming, and predictable structure.",
    icon: Code2,
  },
  {
    title: "Performance-minded",
    description: "I optimize where it matters: shipping fast UIs and reliable backends without over-engineering.",
    icon: Rocket,
  },
  {
    title: "DevOps & homelab",
    description: "I enjoy infrastructure: containerization, monitoring, and building systems that run well in the real world.",
    icon: Server,
  },
];

const skills = [
  "Next.js",
  "React",
  "TypeScript",
  "Go",
  "PostgreSQL",
  "Docker",
  "Tailwind CSS",
  "Git",
  "CI/CD",
  "Kubernetes",
];

const focusAreas = [
  { label: "Frontend", value: "Next.js + TypeScript + shadcn + Tailwind", icon: Cpu },
  { label: "Backend", value: "Go (Fiber), APIs, auth, data modeling", icon: Server },
  { label: "Infra", value: "Docker, Linux, monitoring/observability", icon: Wrench },
];

export default function AboutPage() {
  return (
    <main className="relative flex-1">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[28px_28px]" />
        <div className="absolute left-1/2 top-30 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
      </div>

      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl space-y-12">
            {/* Header */}
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                About
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Building robust systems with clean UX.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                I’m a full-stack developer focused on scalable web apps, strong architecture, and
                production-ready engineering.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="rounded-2xl">
                  <Link href="/projects">
                    View projects <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <Card
                  key={title}
                  className="bg-background/80 backdrop-blur dark:bg-background/60"
                >
                  <CardHeader className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Main content grid */}
            <div className="grid gap-6 md:grid-cols-5">
              {/* Background / bio */}
              <Card className="md:col-span-3 bg-background/80 backdrop-blur dark:bg-background/60">
                <CardHeader>
                  <CardTitle>Background</CardTitle>
                  <CardDescription>What I like building and how I approach it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    I specialize in modern web development and love building products that feel
                    polished. I care about clean architecture, good DX, and systems that are easy
                    to extend.
                  </p>
                  <p>
                    My current stack revolves around Next.js + TypeScript on the frontend and Go
                    for backend services. I’m also into DevOps and homelab infrastructure—shipping
                    is as important to me as building.
                  </p>

                  <div className="grid gap-3 pt-2 sm:grid-cols-3">
                    {focusAreas.map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-2xl border bg-muted/30 p-3"
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="md:col-span-2 bg-background/80 backdrop-blur dark:bg-background/60">
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Tools I ship production work with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border bg-muted/30 px-3 py-1 text-xs text-foreground/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Rocket className="h-4 w-4 text-muted-foreground" />
                      What I’m optimizing for
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Building a portfolio with an admin panel + auth, designed to scale into a
                      real platform.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer note */}
            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Want the technical details?</CardTitle>
                  <CardDescription>
                    I’m happy to share architecture decisions, tradeoffs, and implementation notes.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/projects">
                    Browse projects <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
