"use client";

import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench, Briefcase, GraduationCap, ChevronDown, Award, Heart, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { SkillItem } from "@/components/ui/globe";
import { useTheme } from "@/shared/providers/ThemeProvider";
import Image from "next/image";
import type { Skill } from "@/features/skills/lib/types";
import { GitHubSection } from "@/features/github/ui/GitHubSection";
import { useTranslations, useLocale } from "next-intl";

const SkillGlobe = dynamic(
  () => import("@/components/ui/globe").then((m) => m.SkillGlobe),
  { ssr: false }
);

const highlightIcons = [Code2, Rocket, Server];

const workStartDates = [
  Date.UTC(2024, 10, 1, 12),
  Date.UTC(2024, 10, 1, 12),
  Date.UTC(2023, 4, 1, 12),
  Date.UTC(2019, 10, 1, 12),
];
const workEndDates: (number | null)[] = [
  null,
  null,
  Date.UTC(2024, 7, 1, 12),
  Date.UTC(2021, 8, 1, 12),
];
const workLogos = ["K", "CC", "CW", "M"];

const educationDates = [{ start: Date.UTC(2022, 7, 1, 12), end: null, logo: "CH" }];

const certDates = [{ issueDate: Date.UTC(2023, 4, 1, 12), credentialId: "6-1C6-V4QAX8", url: "https://certification.testout.com/verifycert/6-1C6-V4QAX8" }];
const certSkills = [["Computer Hardware", "Technical Support"]];

const volunteerDates = [{ start: Date.UTC(2013, 3, 1, 12), end: Date.UTC(2013, 4, 1, 12) }];

const focusIcons = [Cpu, Server, Wrench];

export default function AboutPage() {
  const { theme } = useTheme();
  const t = useTranslations("about");
  const locale = useLocale();
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [liveSkills, setLiveSkills] = useState<SkillItem[]>([]);
  const [liveCategories, setLiveCategories] = useState<[string, string[]][]>([]);
  const [liveIconMap, setLiveIconMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Skill[]) => {
        if (!data.length) return;
        setLiveSkills(data.map((s) => ({ label: s.label, icon: s.icon })));
        const grouped = new Map<string, { label: string; icon: string }[]>();
        data.forEach((s) => {
          const arr = grouped.get(s.category.name) || [];
          arr.push({ label: s.label, icon: s.icon });
          grouped.set(s.category.name, arr);
        });
        setLiveCategories(
          Array.from(grouped.entries()).map(([cat, items]) => [
            cat,
            items.map((i) => i.label),
          ] as [string, string[]])
        );
        setLiveIconMap(new Map(data.map((s) => [s.label, s.icon])));
      })
      .catch(() => {});
  }, []);

  const calculateDuration = (startTimestamp: number, endTimestamp: number | null): string => {
    const end = endTimestamp || Date.now();
    const diffMs = end - startTimestamp;
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    const parts: string[] = [];
    if (years > 0) parts.push(t("duration.years", { count: years }));
    if (months > 0) parts.push(t("duration.months", { count: months }));
    return parts.join(" ") || t("duration.months", { count: 1 });
  };

  const formatDateRange = (startTimestamp: number, endTimestamp: number | null): string => {
    const dateLocale = locale === "fr" ? "fr-CA" : "en-US";
    const start = new Date(startTimestamp);
    const startMonth = start.toLocaleString(dateLocale, { month: "short" });
    const startYear = start.getFullYear();

    if (!endTimestamp) {
      return `${startMonth} ${startYear} - ${t("present")}`;
    }

    const end = new Date(endTimestamp);
    const endMonth = end.toLocaleString(dateLocale, { month: "short" });
    const endYear = end.getFullYear();

    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  const formatDate = (timestamp: number): string => {
    const dateLocale = locale === "fr" ? "fr-CA" : "en-US";
    const date = new Date(timestamp);
    const month = date.toLocaleString(dateLocale, { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

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

  const workCount = workStartDates.length;
  const sortedWorkIndices = Array.from({ length: workCount }, (_, i) => i)
    .sort((a, b) => workStartDates[b] - workStartDates[a]);
  const visibleWork = showAllExperience ? sortedWorkIndices : sortedWorkIndices.slice(0, 2);

  return (
    <main className="relative flex-1">
      <section className="border-b">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t("title")}
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
                  {t("subtitle")}
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl max-w-2xl">
                  {t("tagline")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="rounded-2xl">
                  <Link href="/projects">
                    {t("viewProjects")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/contact">{t("getInTouch")}</Link>
                </Button>
              </div>
            </div>

            {/* Highlights - Horizontal Flow */}
            <div className="flex flex-wrap gap-8">
              {highlightIcons.map((Icon, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted/40 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{t(`highlights.${i}.title`)}</h3>
                </div>
              ))}
            </div>

            {/* Work Experience - Compact & Expandable */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">{t("experience")}</h2>
              </div>

              <div className="space-y-3">
                {visibleWork.map((jobIdx) => {
                  const period = formatDateRange(workStartDates[jobIdx], workEndDates[jobIdx]);
                  const duration = calculateDuration(workStartDates[jobIdx], workEndDates[jobIdx]);
                  const isExpanded = expandedJobs.has(jobIdx);
                  const isActive = !workEndDates[jobIdx];

                  return (
                    <Card
                      key={jobIdx}
                      className={`bg-background/80 backdrop-blur dark:bg-background/60 transition-all ${isActive ? 'border-primary/50' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold">
                            {workLogos[jobIdx]}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">{t(`workExperience.${jobIdx}.role`)}</CardTitle>
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                  <span className="font-medium">{t(`workExperience.${jobIdx}.company`)}</span>
                                  {isActive && (
                                    <>
                                      <span>·</span>
                                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                                        {t("active")}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={() => toggleJob(jobIdx)}
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
                            {t(`workExperience.${jobIdx}.description`)}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {sortedWorkIndices.length > 2 && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setShowAllExperience(!showAllExperience)}
                  >
                    {showAllExperience ? t("showLess") : t("showMore", { count: sortedWorkIndices.length - 2 })}
                  </Button>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">{t("education")}</h2>
              </div>

              <div className="space-y-3">
                {educationDates.map((edu, index) => {
                  const period = formatDateRange(edu.start, edu.end);

                  return (
                    <Card
                      key={index}
                      className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/30"
                    >
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight">
                              {t(`educationList.${index}.degree`)}
                            </CardTitle>
                            {!edu.end && (
                              <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                                {t("active")}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{t(`educationList.${index}.school`)}</div>
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
              <h2 className="text-2xl font-bold tracking-tight">{t("skills")}</h2>

              <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] items-start">
                {/* Skill badges — left */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {liveCategories.map(([category, labels]) => (
                    <div key={category} className={labels.length > 6 ? "col-span-2" : ""}>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 mb-1.5">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {labels.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="rounded-full text-[11px] pl-1.5 pr-2 py-0.5 gap-1 inline-flex items-center"
                          >
                            {liveIconMap.get(s) && (
                              <Image
                                src={liveIconMap.get(s)!}
                                alt=""
                                width={14}
                                height={14}
                                className="shrink-0"
                              />
                            )}
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Globe — right */}
                <div className="hidden lg:block">
                  {liveSkills.length > 0 && (
                    <SkillGlobe
                      skills={liveSkills}
                      height={500}
                      rotateAuto
                      rotateSpeed={0.5}
                      connectionsColor={theme === "dark" ? "#ffffff" : "#000000"}
                      lineOpacity={0.25}
                      iconSize={0.18}
                      iconOffset={0.12}
                      depthFade
                    />
                  )}
                </div>
              </div>
            </div>

            {/* GitHub — repos, languages, radar chart */}
            <GitHubSection />

            {/* Focus Areas - Horizontal Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">{t("focusAreas")}</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {focusIcons.map((Icon, i) => (
                  <Card
                    key={i}
                    className="bg-background/80 backdrop-blur dark:bg-background/60"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-sm">{t(`focusAreasList.${i}.label`)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t(`focusAreasList.${i}.value`)}</div>
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
                <h2 className="text-2xl font-bold tracking-tight">{t("certifications")}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {certDates.map((cert, index) => (
                  <Card key={index} className="bg-background/80 backdrop-blur dark:bg-background/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{t(`certificationsList.${index}.title`)}</CardTitle>
                          <div className="text-sm text-muted-foreground">{t(`certificationsList.${index}.issuer`)}</div>
                        </div>
                        <Award className="h-5 w-5 text-primary shrink-0" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {t("issued", { date: formatDate(cert.issueDate) })}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="text-xs text-muted-foreground">
                        {t("credentialId", { id: cert.credentialId })}
                      </div>

                      {certSkills[index] && certSkills[index].length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {certSkills[index].map((skill) => (
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
                          {t("verify")} <ExternalLink className="ml-2 h-3 w-3" />
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
                <h2 className="text-2xl font-bold tracking-tight">{t("volunteer")}</h2>
              </div>

              <div className="space-y-3">
                {volunteerDates.map((vol, index) => {
                  const period = formatDateRange(vol.start, vol.end);
                  const duration = calculateDuration(vol.start, vol.end);

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
                                <CardTitle className="text-base">{t(`volunteerList.${index}.role`)}</CardTitle>
                                <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                  <span className="font-medium">{t(`volunteerList.${index}.organization`)}</span>
                                  <span>·</span>
                                  <Badge variant="outline" className="text-xs px-2 py-0">{t(`volunteerList.${index}.cause`)}</Badge>
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
                          {t(`volunteerList.${index}.description`)}
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
                  <CardTitle className="text-lg">{t("currentlyBuilding")}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("currentlyBuildingDesc")}
                </p>
              </CardHeader>
            </Card>

            {/* CTA - Left Aligned */}
            <div className="space-y-4 py-8">
              <h3 className="text-xl font-semibold">{t("letsWork")}</h3>
              <p className="text-muted-foreground">
                {t("openTo")}
              </p>
              <Button asChild className="rounded-2xl">
                <Link href="/contact">
                  {t("getInTouch")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
