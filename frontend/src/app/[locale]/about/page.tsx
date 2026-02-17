"use client";

import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Cpu, Rocket, Server, Wrench, Briefcase, GraduationCap, ChevronDown, Award, Heart, ExternalLink, Images } from "lucide-react";
import { useEffect, useState } from "react";
import type { SkillItem } from "@/components/ui/globe";
import { useTheme } from "@/shared/providers/ThemeProvider";
import Image from "next/image";
import type { Skill } from "@/features/skills/lib/types";
import { GitHubSection } from "@/features/github/ui/GitHubSection";
import { HobbiesSection } from "@/features/hobbies/ui/HobbiesSection";
import { useTranslations, useLocale } from "next-intl";
import type { Experience, ExperienceMedia } from "@/features/experience/lib/types";
import { localizeExperience } from "@/lib/localize";
import { MediaGalleryDialog } from "@/features/experience/ui/MediaGalleryDialog";

const SkillGlobe = dynamic(
  () => import("@/components/ui/globe").then((m) => m.SkillGlobe),
  { ssr: false }
);

const highlightIcons = [Code2, Rocket, Server];
const focusIcons = [Cpu, Server, Wrench];

export default function AboutPage() {
  const { theme } = useTheme();
  const t = useTranslations("about");
  const locale = useLocale();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [liveSkills, setLiveSkills] = useState<SkillItem[]>([]);
  const [liveCategories, setLiveCategories] = useState<[string, string[]][]>([]);
  const [liveIconMap, setLiveIconMap] = useState<Map<string, string>>(new Map());

  // Experience data from DB
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [mediaDialog, setMediaDialog] = useState<{ open: boolean; title: string; media: ExperienceMedia[] }>({
    open: false,
    title: "",
    media: [],
  });

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

  useEffect(() => {
    fetch("/api/experience")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Experience[]) => {
        setExperiences(data.map((e) => localizeExperience(e, locale)));
      })
      .catch(() => {});
  }, [locale]);

  const work = experiences
    .filter((e) => e.type === "WORK")
    .sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bStart - aStart;
    });
  const education = experiences.filter((e) => e.type === "EDUCATION");
  const certifications = experiences.filter((e) => e.type === "CERTIFICATION");
  const volunteer = experiences.filter((e) => e.type === "VOLUNTEER");

  const visibleWork = showAllExperience ? work : work.slice(0, 2);

  const calculateDuration = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return "";
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const diffMs = end - start;
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    const parts: string[] = [];
    if (years > 0) parts.push(t("duration.years", { count: years }));
    if (months > 0) parts.push(t("duration.months", { count: months }));
    return parts.join(" ") || t("duration.months", { count: 1 });
  };

  const formatDateRange = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return "";
    const dateLocale = locale === "fr" ? "fr-CA" : "en-US";
    const start = new Date(startDate);
    const startMonth = start.toLocaleString(dateLocale, { month: "short" });
    const startYear = start.getFullYear();

    if (!endDate) {
      return `${startMonth} ${startYear} - ${t("present")}`;
    }

    const end = new Date(endDate);
    const endMonth = end.toLocaleString(dateLocale, { month: "short" });
    const endYear = end.getFullYear();

    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  const formatSingleDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const dateLocale = locale === "fr" ? "fr-CA" : "en-US";
    const date = new Date(dateStr);
    const month = date.toLocaleString(dateLocale, { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const toggleJob = (id: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openMedia = (title: string, media: ExperienceMedia[]) => {
    setMediaDialog({ open: true, title, media });
  };

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

            {/* Work Experience */}
            {work.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">{t("experience")}</h2>
                </div>

                <div className="space-y-3">
                  {visibleWork.map((job) => {
                    const period = formatDateRange(job.startDate, job.endDate);
                    const duration = calculateDuration(job.startDate, job.endDate);
                    const isExpanded = expandedJobs.has(job.id);
                    const isActive = !job.endDate && !!job.startDate;

                    return (
                      <Card
                        key={job.id}
                        className={`bg-background/80 backdrop-blur dark:bg-background/60 transition-all ${isActive ? 'border-primary/50' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {job.logo ? (
                              <img src={job.logo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover border" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold">
                                {job.organization.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base">{job.title}</CardTitle>
                                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                    <span className="font-medium">{job.organization}</span>
                                    {job.jobType && (
                                      <>
                                        <span>·</span>
                                        <span>{job.jobType}</span>
                                      </>
                                    )}
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
                                  onClick={() => toggleJob(job.id)}
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
                            {job.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {job.description}
                              </p>
                            )}
                            {job.location && (
                              <p className="text-xs text-muted-foreground">{job.location}</p>
                            )}
                            {job.media.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl gap-2"
                                onClick={() => openMedia(job.title, job.media)}
                              >
                                <Images className="h-4 w-4" />
                                {t("viewMedia")} ({job.media.length})
                              </Button>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {work.length > 2 && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                      onClick={() => setShowAllExperience(!showAllExperience)}
                    >
                      {showAllExperience ? t("showLess") : t("showMore", { count: work.length - 2 })}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">{t("education")}</h2>
                </div>

                <div className="space-y-3">
                  {education.map((edu) => {
                    const period = formatDateRange(edu.startDate, edu.endDate);
                    const isActive = !edu.endDate && !!edu.startDate;

                    return (
                      <Card
                        key={edu.id}
                        className={`bg-background/80 backdrop-blur dark:bg-background/60 ${isActive ? 'border-primary/30' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {edu.logo ? (
                              <img src={edu.logo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover border" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-bold">
                                {edu.organization.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base leading-tight">
                                  {edu.title}
                                </CardTitle>
                                {isActive && (
                                  <Badge variant="default" className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-xs px-2 py-0">
                                    {t("active")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{edu.organization}</div>
                              {edu.location && (
                                <div className="text-xs text-muted-foreground">{edu.location}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">{period}</div>
                            </div>
                          </div>
                        </CardHeader>
                        {(edu.description || edu.media.length > 0) && (
                          <CardContent className="pt-0 space-y-3">
                            {edu.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {edu.description}
                              </p>
                            )}
                            {edu.media.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl gap-2"
                                onClick={() => openMedia(edu.title, edu.media)}
                              >
                                <Images className="h-4 w-4" />
                                {t("viewMedia")} ({edu.media.length})
                              </Button>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Hobbies & Interests */}
            <HobbiesSection />

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
            {certifications.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">{t("certifications")}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {certifications.map((cert) => (
                    <Card key={cert.id} className="bg-background/80 backdrop-blur dark:bg-background/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{cert.title}</CardTitle>
                            <div className="text-sm text-muted-foreground">{cert.organization}</div>
                          </div>
                          <Award className="h-5 w-5 text-primary shrink-0" />
                        </div>
                        {cert.startDate && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {t("issued", { date: formatSingleDate(cert.startDate) })}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        {cert.credentialId && (
                          <div className="text-xs text-muted-foreground">
                            {t("credentialId", { id: cert.credentialId })}
                          </div>
                        )}

                        {cert.skills.length > 0 && (
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

                        {cert.credentialUrl && (
                          <Button asChild variant="outline" size="sm" className="w-full rounded-2xl">
                            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                              {t("verify")} <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        )}

                        {cert.media.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl gap-2"
                            onClick={() => openMedia(cert.title, cert.media)}
                          >
                            <Images className="h-4 w-4" />
                            {t("viewMedia")} ({cert.media.length})
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Volunteer Experience */}
            {volunteer.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">{t("volunteer")}</h2>
                </div>

                <div className="space-y-3">
                  {volunteer.map((vol) => {
                    const period = formatDateRange(vol.startDate, vol.endDate);
                    const duration = calculateDuration(vol.startDate, vol.endDate);

                    return (
                      <Card key={vol.id} className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10">
                              <Heart className="h-5 w-5 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <CardTitle className="text-base">{vol.title}</CardTitle>
                                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                                    <span className="font-medium">{vol.organization}</span>
                                    {vol.cause && (
                                      <>
                                        <span>·</span>
                                        <Badge variant="outline" className="text-xs px-2 py-0">{vol.cause}</Badge>
                                      </>
                                    )}
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

                        <CardContent className="pt-0 space-y-3">
                          {vol.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {vol.description}
                            </p>
                          )}
                          {vol.media.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl gap-2"
                              onClick={() => openMedia(vol.title, vol.media)}
                            >
                              <Images className="h-4 w-4" />
                              {t("viewMedia")} ({vol.media.length})
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

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

      <MediaGalleryDialog
        open={mediaDialog.open}
        onOpenChange={(open) => setMediaDialog((prev) => ({ ...prev, open }))}
        title={mediaDialog.title}
        media={mediaDialog.media}
      />
    </main>
  );
}
