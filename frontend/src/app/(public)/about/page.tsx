import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench, Briefcase, GraduationCap, MapPin, Calendar, Award, Heart, ExternalLink } from "lucide-react";

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

const workExperience = [
  {
    startDate: Date.UTC(2024, 10, 1, 12),
    endDate: null,
    role: "Founder",
    company: "Kleff",
    jobType: "Self-employed",
    location: "Montreal, Quebec, Canada · Hybrid",
    description:
      "Leading the vision, architecture, and development of Kleff, a developer-first cloud infrastructure platform. I design and build the core systems while guiding product direction, technical strategy, and business operations.",
    skills: [
      "Business Ownership",
      "Software Infrastructure",
      "Product Strategy",
      "System Architecture",
      "Go",
      "Next.js",
      "Docker",
      "Kubernetes",
    ],
    logo: "K",
  },
  {
    startDate: Date.UTC(2024, 10, 1, 12),
    endDate: null,
    role: "Sales Associate",
    company: "Canada Computers & Electronics",
    jobType: "Permanent Part-time",
    location: "Brossard, Quebec, Canada · On-site",
    description:
      "I communicated with clients to understand their needs and guide them towards a product that matched their requirements.",
    skills: ["Sales", "Communication", "Customer Service", "Product Knowledge"],
    logo: "CC",
  },
  {
    startDate: Date.UTC(2023, 4, 1, 12),
    endDate: Date.UTC(2024, 7, 1, 12),
    role: "Stocker",
    company: "Costco Wholesale",
    jobType: "Permanent Part-time",
    location: "Candiac, Quebec, Canada · On-site",
    description:
      "I was a merchandise placer responsible for placing stock and maintaining prices and quality in the freezer department.",
    skills: ["Organization Skills", "Time Management", "Attention to Detail"],
    logo: "CW",
  },
  {
    startDate: Date.UTC(2019, 10, 1, 12),
    endDate: Date.UTC(2021, 8, 1, 12),
    role: "Team Leader",
    company: "McDonald's",
    jobType: "Permanent Part-time",
    location: "Laprairie, Quebec, Canada · On-site",
    description:
      "I worked as the team leader for the McDonalds kitchen team to ensure quality control, fluid workflow, and proper customer satisfaction.",
    skills: ["Teamwork", "Communication", "Leadership", "Quality Control"],
    logo: "M",
  },
];

const education = [
  {
    startDate: Date.UTC(2022, 7, 1, 12),
    endDate: null,
    degree: "DEC in Computer Science",
    school: "Champlain College",
    location: "Saint-Lambert, Quebec",
    description:
      "Focused on software development, algorithms, data structures, and system design.",
    logo: "CH",
  },
];

const certifications = [
  {
    title: "TestOut PC Pro Certification",
    issuer: "TestOut Corporation",
    issueDate: Date.UTC(2023, 4, 1, 12),
    credentialId: "6-1C6-V4QAX8",
    url: "https://certification.testout.com/verifycert/6-1C6-V4QAX8",
    skills: ["Computer Hardware", "Technical Support"],
  },
];

const volunteerExperience = [
  {
    role: "Fundraiser",
    organization: "Vidéotron",
    startDate: Date.UTC(2013, 3, 1, 12),
    endDate: Date.UTC(2013, 4, 1, 12),
    cause: "Children",
    description:
      "Participated in a fundraising initiative for Enfants du Soleil with Vidéotron, working outdoors alongside other volunteers to collect donations in support of children's healthcare.",
  },
];

const calculateDuration = (startTimestamp: number, endTimestamp: number | null): string => {
  const end = endTimestamp || Date.now();
  const diffMs = end - startTimestamp;
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  
  if (years > 0 && months > 0) {
    return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} yr${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} mo${months > 1 ? 's' : ''}`;
  } else {
    return '1 mo';
  }
};

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

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

const sortedWork = [...workExperience].sort((a, b) => b.startDate - a.startDate);
const sortedEducation = [...education].sort((a, b) => b.startDate - a.startDate);

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

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Work Experience</h2>
              </div>

              <div className="relative">
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-8">
                  {sortedWork.map((job, index) => {
                    const period = formatDateRange(job.startDate, job.endDate);
                    const duration = calculateDuration(job.startDate, job.endDate);
                    
                    return (
                      <div key={index} className="relative pl-8">
                        <div className="absolute left-0 top-6">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-background bg-primary" />
                        </div>

                        <Card className={`bg-background/80 backdrop-blur dark:bg-background/60 ${!job.endDate ? 'border-primary/50 shadow-primary/10 shadow-lg' : ''}`}>
                          <CardHeader>
                            <div className="flex gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-lg font-bold">
                                {job.logo}
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <CardTitle className="text-lg">{job.role}</CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                      <span className="font-medium">{job.company}</span>
                                      <span>·</span>
                                      <span>{job.jobType}</span>
                                    </div>
                                  </div>
                                  {!job.endDate && (
                                    <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
                                      Active
                                    </Badge>
                                  )}
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
                                    <span>{job.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {job.description}
                            </p>

                            {job.skills && (
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill) => (
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Education</h2>
              </div>

              <div className="space-y-4">
                {sortedEducation.map((edu, index) => {
                  const period = formatDateRange(edu.startDate, edu.endDate);
                  
                  return (
                    <Card key={index} className={`bg-background/80 backdrop-blur dark:bg-background/60 border-primary/30 ${!edu.endDate ? 'shadow-primary/10 shadow-lg' : ''}`}>
                      <CardHeader>
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-lg font-bold text-primary">
                            {edu.logo}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-lg">{edu.degree}</CardTitle>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">{edu.school}</span>
                                </div>
                              </div>
                              {!edu.endDate && (
                                <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{period}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{edu.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {edu.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Certifications</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {certifications.map((cert, index) => (
                  <Card key={index} className="bg-background/80 backdrop-blur dark:bg-background/60">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{cert.title}</CardTitle>
                          <CardDescription>{cert.issuer}</CardDescription>
                        </div>
                        <Award className="h-5 w-5 text-primary shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Issued {formatDate(cert.issueDate)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Credential ID: <span className="font-mono">{cert.credentialId}</span>
                      </div>
                      
                      {cert.skills && (
                        <div className="flex flex-wrap gap-2">
                          {cert.skills.map((skill) => (
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

                      <Button asChild variant="outline" size="sm" className="w-full rounded-2xl">
                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                          Verify Credential <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Volunteer Experience</h2>
              </div>

              <div className="space-y-4">
                {volunteerExperience.map((vol, index) => {
                  const period = formatDateRange(vol.startDate, vol.endDate);
                  const duration = calculateDuration(vol.startDate, vol.endDate);
                  
                  return (
                    <Card key={index} className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/20">
                      <CardHeader>
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10">
                            <Heart className="h-6 w-6 text-primary" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-lg">{vol.role}</CardTitle>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">{vol.organization}</span>
                                  <span>·</span>
                                  <Badge variant="outline" className="text-xs">{vol.cause}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{period}</span>
                                <span>·</span>
                                <span>{duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {vol.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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