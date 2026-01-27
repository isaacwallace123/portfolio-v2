import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench, Briefcase, GraduationCap, MapPin, Calendar } from "lucide-react";

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

// Timeline entries with Unix timestamps (milliseconds since epoch)
const timelineEntries = [
  {
    type: "experience" as const,
    startDate: 1698796800000, // Nov 1, 2024 -> Changed to Oct 1, 2024
    endDate: null, // null means present
    role: "Founder",
    company: "Kleff",
    jobType: "Self-employed",
    location: "Montreal, Quebec, Canada · Hybrid",
    description: "Leading the vision, architecture, and development of Kleff, a developer-first cloud infrastructure platform. I design and build the core systems while guiding product direction, technical strategy, and business operations.",
    skills: ["Business Ownership", "Software Infrastructure", "Product Strategy", "System Architecture", "Go", "Next.js", "Docker", "Kubernetes"],
    logo: "K",
  },
  {
    type: "experience" as const,
    startDate: 1727740800000, // Oct 1, 2024
    endDate: null,
    role: "Sales Associate",
    company: "Canada Computers & Electronics",
    jobType: "Permanent Part-time",
    location: "Brossard, Quebec, Canada · On-site",
    description: "I communicated with clients to understand their needs and guide them towards a product that matched their requirements.",
    skills: ["Sales", "Communication", "Customer Service", "Product Knowledge"],
    logo: "CC",
  },
  {
    type: "experience" as const,
    startDate: 1685577600000, // Jun 1, 2023
    endDate: 1722470400000, // Aug 1, 2024
    role: "Stocker",
    company: "Costco Wholesale",
    jobType: "Permanent Part-time",
    location: "Candiac, Quebec, Canada · On-site",
    description: "I was a merchandise placer responsible for placing stock and maintaining prices and quality in the freezer department.",
    skills: ["Organization Skills", "Time Management", "Attention to Detail"],
    logo: "CW",
  },
  {
    type: "education" as const,
    startDate: 1661990400000, // Sep 1, 2022
    endDate: null, // Still ongoing
    degree: "DEC in Computer Science",
    school: "Champlain College",
    location: "Saint-Lambert, Quebec",
    description: "Focused on software development, algorithms, data structures, and system design.",
    logo: "CH",
  },
  {
    type: "experience" as const,
    startDate: 1569888000000, // Oct 1, 2019
    endDate: 1630454400000, // Sep 1, 2021
    role: "Team Leader",
    company: "McDonald's",
    jobType: "Permanent Part-time",
    location: "Laprairie, Quebec, Canada · On-site",
    description: "I worked as the team leader for the McDonalds kitchen team to ensure quality control, fluid workflow, and proper customer satisfaction.",
    skills: ["Teamwork", "Communication", "Leadership", "Quality Control"],
    logo: "M",
  },
];

// Helper function to format duration
const calculateDuration = (startTimestamp: number, endTimestamp: number | null): string => {
  const end = endTimestamp || Date.now();
  const diffMs = end - startTimestamp;
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
  
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  
  if (years > 0 && months > 0) {
    return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} yr${years > 1 ? 's' : ''}`;
  } else {
    return `${months} mo${months > 1 ? 's' : ''}`;
  }
};

// Helper function to format date range
const formatDateRange = (startTimestamp: number, endTimestamp: number | null): string => {
  const start = new Date(startTimestamp);
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  
  if (!endTimestamp) {
    return `${startMonth} ${startYear} - Present`;
  }
  
  const end = new Date(endTimestamp);
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const endYear = end.getFullYear();
  
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
};

// Sort by START date (most recent first)
const sortedTimeline = [...timelineEntries].sort((a, b) => {
  return b.startDate - a.startDate;
});

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
  "Linux",
  "Node.js",
  "REST APIs",
  "System Design",
];

const focusAreas = [
  { label: "Frontend", value: "Next.js + TypeScript + shadcn + Tailwind", icon: Cpu },
  { label: "Backend", value: "Go (Fiber), APIs, auth, data modeling", icon: Server },
  { label: "Infra", value: "Docker, Linux, monitoring/observability", icon: Wrench },
];

export default function AboutPage() {
  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl space-y-12">
            {/* Header */}
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                About
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Building robust systems with clean UX.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                I'm a full-stack developer focused on scalable web apps, strong architecture, and
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

            {/* Timeline Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Experience & Education</h2>
              </div>

              {/* Timeline Container */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-8">
                  {sortedTimeline.map((item, index) => {
                    // Calculate period and duration
                    const period = formatDateRange(item.startDate, item.endDate);
                    const duration = calculateDuration(item.startDate, item.endDate);
                    
                    return (
                    <div key={index} className="relative pl-8">
                      {/* Timeline dot without date */}
                      <div className="absolute left-0 top-6">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-background bg-primary" />
                      </div>

                      {item.type === "experience" ? (
                        // Experience Card
                        <Card className={`bg-background/80 backdrop-blur dark:bg-background/60 ${!item.endDate ? 'border-primary/50 shadow-primary/10 shadow-lg' : ''}`}>
                          <CardHeader>
                            <div className="flex gap-4">
                              {/* Company Logo/Initial */}
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-lg font-bold">
                                {item.logo}
                              </div>

                              {/* Job Details */}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <CardTitle className="text-lg">{item.role}</CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                      <span className="font-medium">{item.company}</span>
                                      <span>·</span>
                                      <span>{item.jobType}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!item.endDate && (
                                      <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
                                        Active
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="shrink-0">
                                      <Briefcase className="mr-1 h-3 w-3" />
                                      Work
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{period}</span>
                                    <span>·</span>
                                    <span>{duration}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>

                            {/* Skills */}
                            {item.skills && (
                              <div className="flex flex-wrap gap-2">
                                {item.skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="rounded-full text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        // Education Card
                        <Card className={`bg-background/80 backdrop-blur dark:bg-background/60 border-primary/30 ${!item.endDate ? 'shadow-primary/10 shadow-lg' : ''}`}>
                          <CardHeader>
                            <div className="flex gap-4">
                              {/* School Logo/Initial */}
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-lg font-bold text-primary">
                                {item.logo}
                              </div>

                              {/* Education Details */}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <CardTitle className="text-lg">{item.degree}</CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                      <span className="font-medium">{item.school}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!item.endDate && (
                                      <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
                                        Active
                                      </Badge>
                                    )}
                                    <Badge variant="default" className="shrink-0">
                                      <GraduationCap className="mr-1 h-3 w-3" />
                                      Education
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{period}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Skills & Tech Stack */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Technical Skills */}
              <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
                <CardHeader>
                  <CardTitle>Technical Skills</CardTitle>
                  <CardDescription>Technologies I work with regularly</CardDescription>
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
                </CardContent>
              </Card>

              {/* Focus Areas */}
              <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
                <CardHeader>
                  <CardTitle>Focus Areas</CardTitle>
                  <CardDescription>What I specialize in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
            </div>

            {/* Current Focus */}
            <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <CardTitle>Currently Building</CardTitle>
                </div>
                <CardDescription>What I'm working on right now</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Building Kleff, a developer-first cloud infrastructure platform, and refining my
                  portfolio with an admin panel + auth system, designed to scale into a full
                  platform for showcasing projects and technical writing.
                </p>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Want to work together?</CardTitle>
                  <CardDescription>
                    I'm open to freelance work, consulting, and full-time opportunities.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/contact">
                    Get in touch <ArrowRight className="ml-2 h-4 w-4" />
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