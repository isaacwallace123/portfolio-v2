"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench, Briefcase, GraduationCap, ChevronDown, Award, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";

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
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [showAllExperience, setShowAllExperience] = useState(false);

  const toggleJob = (index: number) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const visibleWork = showAllExperience ? sortedWork : sortedWork.slice(0, 2);

  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  About
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
                  Building robust systems with clean UX
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                  Full-stack developer focused on scalable web apps and production-ready engineering
                </p>
              </div>

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

            {/* Highlights - Horizontal Flow */}
            <div className="flex flex-wrap gap-8">
              {highlights.map(({ title, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-center gap-3"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted/40 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                </div>
              ))}
            </div>

            {/* Work Experience - Compact & Expandable */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Experience</h2>
              </div>

              <div className="space-y-3">
                {visibleWork.map((job, index) => {
                  const period = formatDateRange(job.startDate, job.endDate);
                  const duration = calculateDuration(job.startDate, job.endDate);
                  const isExpanded = expandedJobs.has(index);

                  return (
                    <Card
                      key={index}
                      className={`bg-background/80 backdrop-blur dark:bg-background/60 transition-all ${!job.endDate ? 'border-primary/50' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold">
                            {job.logo}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">{job.role}</CardTitle>
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                  <span className="font-medium">{job.company}</span>
                                  {!job.endDate && (
                                    <>
                                      <span>·</span>
                                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                                        Active
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={() => toggleJob(index)}
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{period}</span>
                              <span>·</span>
                              <span>{duration}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 space-y-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {job.description}
                          </p>

                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="rounded-full text-xs px-2 py-0.5"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {sortedWork.length > 2 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setShowAllExperience(!showAllExperience)}
                  >
                    {showAllExperience ? 'Show Less' : `Show ${sortedWork.length - 2} More`}
                  </Button>
                </div>
              )}
            </div>

            {/* Two Column Layout - Education & Skills */}
            <div className="grid md:grid-cols-2 gap-12">
              {/* Education */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">Education</h2>
                </div>

                <div className="space-y-3">
                  {sortedEducation.map((edu, index) => {
                    const period = formatDateRange(edu.startDate, edu.endDate);

                    return (
                      <Card
                        key={index}
                        className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/30"
                      >
                        <CardHeader className="pb-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight">
                                {edu.degree}
                              </CardTitle>
                              {!edu.endDate && (
                                <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{edu.school}</div>
                            <div className="text-xs text-muted-foreground">{period}</div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border bg-muted/30 px-3 py-1.5 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Areas - Horizontal Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Focus Areas</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {focusAreas.map(({ label, value, icon: Icon }) => (
                  <Card
                    key={label}
                    className="bg-background/80 backdrop-blur dark:bg-background/60"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-sm">{label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{value}</div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Certifications</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {certifications.map((cert, index) => (
                  <Card key={index} className="bg-background/80 backdrop-blur dark:bg-background/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{cert.title}</CardTitle>
                          <div className="text-sm text-muted-foreground">{cert.issuer}</div>
                        </div>
                        <Award className="h-5 w-5 text-primary shrink-0" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Issued {formatDate(cert.issueDate)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="text-xs text-muted-foreground">
                        ID: <span className="font-mono">{cert.credentialId}</span>
                      </div>

                      {cert.skills && cert.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {cert.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="rounded-full text-xs px-2 py-0.5"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button asChild variant="outline" size="sm" className="w-full rounded-2xl">
                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                          Verify <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Volunteer Experience */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Volunteer</h2>
              </div>

              <div className="space-y-3">
                {volunteerExperience.map((vol, index) => {
                  const period = formatDateRange(vol.startDate, vol.endDate);
                  const duration = calculateDuration(vol.startDate, vol.endDate);

                  return (
                    <Card key={index} className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10">
                            <Heart className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <CardTitle className="text-base">{vol.role}</CardTitle>
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                  <span className="font-medium">{vol.organization}</span>
                                  <span>·</span>
                                  <Badge variant="outline" className="text-xs px-2 py-0">{vol.cause}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{period}</span>
                              <span>·</span>
                              <span>{duration}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {vol.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Currently Building - Left Aligned */}
            <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Currently Building</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Kleff — a developer-first cloud infrastructure platform
                </p>
              </CardHeader>
            </Card>

            {/* CTA - Left Aligned */}
            <div className="space-y-4 py-8">
              <h3 className="text-xl font-semibold">Let's work together</h3>
              <p className="text-muted-foreground">
                Open to freelance, consulting, and full-time opportunities
              </p>
              <Button asChild className="rounded-2xl">
                <Link href="/contact">
                  Get in touch <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}