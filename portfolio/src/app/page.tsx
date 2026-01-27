import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { Header } from "@/widgets/Header";

const tech = ["Next.js", "React", "TypeScript", "Go", "PostgreSQL", "Docker"];

export default function HomePage() {
  return (
    <>
      <main className="relative flex-1">
        {/* Background: grid + soft glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[28px_28px]" />
          <div className="absolute left-1/2 top-30 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        </div>

        {/* Hero */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="space-y-6">
                {/* badge */}
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-sm shadow-sm backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-muted-foreground">Available for opportunities</span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Hi, I’m{" "}
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

              {/* Right: “card” */}
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

        {/* Featured section (placeholder but modern) */}
        <section className="py-14">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="grid items-center gap-12 md:grid-cols-2">

              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Featured
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  Projects worth clicking
                </h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href="/projects">See all</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {["Observability Dashboard", "Kleff Control Plane", "CI/CD Templates"].map((title) => (
                <div
                  key={title}
                  className="group rounded-3xl border bg-background/80 dark:bg-background/60 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="text-sm font-medium text-muted-foreground">Case study</div>
                  <div className="mt-2 text-lg font-semibold">{title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Short, punchy one-liner about impact, scale, and what you built.
                  </p>
                  <div className="mt-4 text-sm text-primary opacity-0 transition group-hover:opacity-100">
                    View details →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
