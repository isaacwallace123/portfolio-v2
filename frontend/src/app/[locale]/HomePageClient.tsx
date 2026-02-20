'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { CVDownloadButton } from '@/features/cv/ui/CVDownloadButton';
import { GitHubSection } from '@/features/github/ui/GitHubSection';
import { HobbiesSection } from '@/features/hobbies/ui/HobbiesSection';
import { ContactForm } from '@/features/contacts/ui/ContactForm';
import { TestimonialsSection } from '@/features/testimonials/ui/TestimonialsSection';
import { MediaGalleryDialog } from '@/features/experience/ui/MediaGalleryDialog';
import { useGithubStats } from '@/features/github/hooks/useGithubStats';
import { getLanguageColor } from '@/features/github/lib/languageUtils';
import type { GithubRepo } from '@/features/github/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import NextLink from 'next/link';
import {
  ArrowRight,
  ArrowDown,
  Github,
  Linkedin,
  Mail,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ExternalLink,
  Images,
  Star,
  Code2,
  Rocket,
  Server,
  Award,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { SkillItem } from '@/components/ui/globe';
import type { Skill } from '@/features/skills/lib/types';
import type { Experience, ExperienceMedia } from '@/features/experience/lib/types';
import type { Project } from '@/features/projects/lib/types';
import { TechStackBadges } from '@/features/projects/ui/TechStackBadges';
import { localizeExperience, localizeProject } from '@/lib/localize';
import { AnimatedBackground } from '@/shared/ui/AnimatedBackground';

const SkillGlobe = dynamic(
  () => import('@/components/ui/globe').then((m) => m.SkillGlobe),
  { ssr: false }
);

const tech = ['Next.js', 'React', 'TypeScript', 'Go', 'PostgreSQL', 'Docker'];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 38, startDelay = 0) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ─── Fade-in on scroll ───────────────────────────────────────────────────────
function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="text-xs font-bold uppercase tracking-widest text-primary">{children}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HomePageClient({ locale }: { locale: string }) {
  const { theme } = useTheme();
  const t = useTranslations('home');
  const ta = useTranslations('about');

  // Skills
  const [liveSkills, setLiveSkills] = useState<SkillItem[]>([]);
  const [liveCategories, setLiveCategories] = useState<[string, string[]][]>([]);
  const [liveIconMap, setLiveIconMap] = useState<Map<string, string>>(new Map());

  // Experience
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [mediaDialog, setMediaDialog] = useState<{ open: boolean; title: string; media: ExperienceMedia[] }>({
    open: false,
    title: '',
    media: [],
  });

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);

  // GitHub stats — used to enrich project cards with per-repo language data
  const { stats: githubStats } = useGithubStats();
  const repoByUrl = useMemo(() => {
    const map = new Map<string, GithubRepo>();
    for (const repo of githubStats?.repos ?? []) {
      map.set(repo.html_url, repo);
    }
    return map;
  }, [githubStats]);

  // Skill icon lookup derived from the already-fetched skills list (local URLs only)
  const skillIconsRecord = useMemo<Record<string, string>>(() => {
    const rec: Record<string, string> = {};
    for (const [label, icon] of liveIconMap) {
      rec[label.toLowerCase()] = icon;
    }
    return rec;
  }, [liveIconMap]);

  // Hero typewriter
  const greetingText = locale === 'fr' ? 'Bonjour, je suis Isaac Wallace.' : "Hi, I'm Isaac Wallace.";
  const taglineText = locale === 'fr'
    ? "Développeur full-stack, architecture propre et excellente UX."
    : "Full-stack developer building scalable, elegant products.";

  const { displayed: greetingDisplayed, done: greetingDone } = useTypewriter(greetingText, 40, 300);
  const { displayed: taglineDisplayed } = useTypewriter(taglineText, 28, greetingDone ? 200 : 99999);

  useEffect(() => {
    fetch('/api/skills')
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
          Array.from(grouped.entries()).map(([cat, items]) => [cat, items.map((i) => i.label)] as [string, string[]])
        );
        setLiveIconMap(new Map(data.map((s) => [s.label, s.icon])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/experience')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Experience[]) => {
        setExperiences(data.map((e) => localizeExperience(e, locale)));
      })
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    fetch('/api/projects?published=true')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Project[]) => {
        setProjects(
          data
            .map((p) => localizeProject(p as any, locale) as Project)
            .sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return (a.order ?? 0) - (b.order ?? 0);
            })
        );
      })
      .catch(() => {});
  }, [locale]);

  const work = experiences
    .filter((e) => e.type === 'WORK')
    .sort((a, b) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bStart - aStart;
    });
  const education = experiences.filter((e) => e.type === 'EDUCATION');
  const certifications = experiences.filter((e) => e.type === 'CERTIFICATION');

  const calculateDuration = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return '';
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const diffMonths = Math.floor((end - start) / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(ta('duration.years', { count: years }));
    if (months > 0) parts.push(ta('duration.months', { count: months }));
    return parts.join(' ') || ta('duration.months', { count: 1 });
  };

  const formatDateRange = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return '';
    const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-US';
    const start = new Date(startDate);
    const startStr = start.toLocaleString(dateLocale, { month: 'short', year: 'numeric' });
    if (!endDate) return `${startStr} — ${ta('present')}`;
    const end = new Date(endDate);
    return `${startStr} — ${end.toLocaleString(dateLocale, { month: 'short', year: 'numeric' })}`;
  };

  const toggleJob = (id: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openMedia = (title: string, media: ExperienceMedia[]) => {
    setMediaDialog({ open: true, title, media });
  };

  const highlightIcons = [Code2, Rocket, Server];

  return (
    <>
      {/* ── keyframe styles ── */}
      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up { animation: hero-fade-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-delay-1 { animation-delay: 0.05s; }
        .hero-delay-2 { animation-delay: 0.15s; }
        .hero-delay-3 { animation-delay: 0.30s; }
        .hero-delay-4 { animation-delay: 0.45s; }
        .hero-delay-5 { animation-delay: 0.55s; }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink { animation: cursor-blink 0.8s step-end infinite; }

        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
        .scroll-bounce { animation: scroll-bounce 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── animated background ── */}
      <AnimatedBackground />

      <main className="relative flex-1">

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section id="hero" className="relative flex min-h-svh flex-col items-center justify-center">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              {/* Left */}
              <div className="space-y-8">
                {/* Availability badge */}
                <div className="hero-fade-up hero-delay-1 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{t('available')}</span>
                </div>

                {/* Heading + tagline */}
                <div className="hero-fade-up hero-delay-2 space-y-5">
                  <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
                    <span className="bg-linear-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                      {greetingDisplayed}
                    </span>
                    <span className="cursor-blink ml-0.5 inline-block w-0.75 h-[0.85em] bg-primary align-middle" />
                  </h1>
                  <p className="text-xl text-muted-foreground md:text-2xl max-w-lg leading-relaxed min-h-8">
                    {taglineDisplayed}
                    {greetingDone && taglineDisplayed.length < taglineText.length && (
                      <span className="cursor-blink ml-0.5 inline-block w-0.5 h-[1em] bg-muted-foreground align-middle" />
                    )}
                  </p>
                </div>

                {/* CTAs */}
                <div className="hero-fade-up hero-delay-3 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-xl px-7 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                    onClick={() => scrollTo('projects')}
                  >
                    {t('viewWork')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <CVDownloadButton variant="outline" size="lg" className="rounded-xl px-7 text-base" />
                </div>

                {/* Socials */}
                <div className="hero-fade-up hero-delay-4 flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground">
                    <a href="https://github.com/isaacwallace123" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                      <Github className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground">
                    <a href="https://linkedin.com/in/isaac-wallace" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground" onClick={() => scrollTo('contact')} aria-label="Email">
                    <Mail className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Right — tech card */}
              <div className="hero-fade-up hero-delay-5 relative lg:justify-self-end w-full max-w-sm">
                {/* Glow ring */}
                <div className="absolute -inset-3 rounded-3xl bg-linear-to-br from-primary/15 via-violet-500/10 to-sky-500/10 blur-xl" />
                <div className="relative rounded-3xl border border-border/50 bg-card/70 dark:bg-card/50 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 dark:ring-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-5">{t('techShipWith')}</p>
                  <div className="flex flex-wrap gap-2 mb-7">
                    {tech.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-border/60 bg-background/60 px-3.5 py-1.5 text-sm font-medium text-foreground/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/6 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-2">{t('currentlyBuilding')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('currentlyBuildingDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <button
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/35 hover:text-muted-foreground/70 transition-colors"
            onClick={() => scrollTo('about')}
            aria-label="Scroll down"
          >
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium">scroll</span>
            <ArrowDown className="h-4 w-4 scroll-bounce" />
          </button>
        </section>

        {/* ══════════════════════════════════════════════════════
            ABOUT
        ══════════════════════════════════════════════════════ */}
        <section id="about" className="py-32">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="space-y-16">
              <FadeIn>
                <div className="space-y-5 max-w-2xl">
                  <SectionLabel>{locale === 'fr' ? 'À propos' : 'About Me'}</SectionLabel>
                  <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{ta('subtitle')}</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">{ta('tagline')}</p>
                </div>
              </FadeIn>

              <div className="grid gap-4 sm:grid-cols-3">
                {highlightIcons.map((Icon, i) => (
                  <FadeIn key={i} delay={i * 80}>
                    <div className="group relative flex items-start gap-4 rounded-2xl border border-border/40 bg-card/50 dark:bg-card/30 p-6 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 cursor-default h-full overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15 group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="relative">
                        <h3 className="font-semibold text-base leading-snug">{ta(`highlights.${i}.title`)}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {ta(`highlights.${i}.description`)}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            EXPERIENCE
        ══════════════════════════════════════════════════════ */}
        <section id="experience" className="py-32">
          <div className="mx-auto w-full max-w-4xl px-6 space-y-16">
            <FadeIn>
              <div className="space-y-4">
                <SectionLabel>{locale === 'fr' ? 'Parcours' : 'My Journey'}</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{ta('experience')}</h2>
              </div>
            </FadeIn>

            {/* Work */}
            {work.length > 0 && (
              <div className="space-y-3">
                <FadeIn>
                  <div className="flex items-center gap-3 pb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/12 border border-blue-500/20">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold">{ta('experience')}</h3>
                  </div>
                </FadeIn>
                {work.map((job, i) => (
                  <FadeIn key={job.id} delay={i * 50}>
                    <ExperienceCard
                      item={job}
                      isExpanded={expandedJobs.has(job.id)}
                      onToggle={() => toggleJob(job.id)}
                      formatDateRange={formatDateRange}
                      calculateDuration={calculateDuration}
                      ta={ta}
                      openMedia={openMedia}
                    />
                  </FadeIn>
                ))}
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="space-y-3">
                <FadeIn>
                  <div className="flex items-center gap-3 pb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/12 border border-violet-500/20">
                      <GraduationCap className="h-4 w-4 text-violet-500" />
                    </div>
                    <h3 className="text-xl font-semibold">{ta('education')}</h3>
                  </div>
                </FadeIn>
                {education.map((edu, i) => (
                  <FadeIn key={edu.id} delay={i * 50}>
                    <ExperienceCard
                      item={edu}
                      isExpanded={expandedJobs.has(edu.id)}
                      onToggle={() => toggleJob(edu.id)}
                      formatDateRange={formatDateRange}
                      calculateDuration={calculateDuration}
                      ta={ta}
                      openMedia={openMedia}
                    />
                  </FadeIn>
                ))}
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="space-y-4">
                <FadeIn>
                  <div className="flex items-center gap-3 pb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/12 border border-amber-500/20">
                      <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-semibold">{ta('certifications')}</h3>
                  </div>
                </FadeIn>
                <div className="grid gap-3 md:grid-cols-2">
                  {certifications.map((cert, i) => (
                    <FadeIn key={cert.id} delay={i * 50}>
                      <div className="flex flex-col rounded-2xl border border-border/40 bg-card/50 dark:bg-card/30 p-5 backdrop-blur-sm hover:border-border/70 transition-colors h-full gap-3">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {cert.logo ? (
                              <img src={cert.logo} alt="" className="h-10 w-10 rounded-xl object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30 font-bold text-sm text-muted-foreground">
                                {cert.organization.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm leading-snug">{cert.title}</h4>
                              <p className="text-sm text-muted-foreground">{cert.organization}</p>
                              {cert.startDate && (
                                <p className="text-xs text-muted-foreground/60 mt-0.5">
                                  {locale === 'fr' ? 'Émis' : 'Issued'}{' '}
                                  {new Date(cert.startDate).toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-US', { month: 'long', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Award className="h-4 w-4 text-amber-500/70 shrink-0 mt-0.5" />
                        </div>

                        {/* Credential ID */}
                        {cert.credentialId && (
                          <p className="text-xs font-mono text-muted-foreground/60">
                            ID: {cert.credentialId}
                          </p>
                        )}

                        {/* Skill tags */}
                        {cert.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {cert.skills.map((s) => (
                              <span key={s} className="rounded-md border border-border/40 bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Verify button */}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-muted/20 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                          >
                            {ta('verify')} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            SKILLS
        ══════════════════════════════════════════════════════ */}
        <section id="skills" className="py-32">
          <div className="mx-auto w-full max-w-6xl px-6 space-y-16">
            <FadeIn>
              <div className="space-y-4">
                <SectionLabel>{locale === 'fr' ? 'Technologies' : 'Tech Stack'}</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{ta('skills')}</h2>
              </div>
            </FadeIn>

            <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start">
              <FadeIn>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {liveCategories.map(([category, labels]) => (
                    <div key={category} className={labels.length > 6 ? 'col-span-2' : ''}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {labels.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="rounded-lg text-xs pl-1.5 pr-2.5 py-1 gap-1.5 inline-flex items-center border border-border/40 bg-background/60 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                          >
                            {liveIconMap.get(s) && (
                              <Image src={liveIconMap.get(s)!} alt="" width={13} height={13} className="shrink-0" />
                            )}
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>

              <div className="hidden lg:block">
                {liveSkills.length > 0 && (
                  <SkillGlobe
                    skills={liveSkills}
                    height={520}
                    rotateAuto
                    rotateSpeed={0.5}
                    connectionsColor={theme === 'dark' ? '#ffffff' : '#000000'}
                    lineOpacity={0.2}
                    iconSize={0.18}
                    iconOffset={0.12}
                    depthFade
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            PROJECTS
        ══════════════════════════════════════════════════════ */}
        <section id="projects" className="py-32">
          <div className="mx-auto w-full max-w-6xl px-6 space-y-16">
            <FadeIn>
              <div className="space-y-4">
                <SectionLabel>{locale === 'fr' ? 'Mon Travail' : 'My Work'}</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t('projectsWorthClicking')}</h2>
              </div>
            </FadeIn>

            {projects.length > 0 ? (
              <ProjectsTimeline projects={projects} locale={locale} repoByUrl={repoByUrl} skillIcons={skillIconsRecord} />
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg">{locale === 'fr' ? 'Chargement...' : 'Loading projects...'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            HOBBIES
        ══════════════════════════════════════════════════════ */}
        <section id="hobbies" className="py-32">
          <div className="mx-auto w-full max-w-6xl px-6 space-y-16">
            <FadeIn>
              <div className="space-y-4">
                <SectionLabel>{locale === 'fr' ? 'Vie personnelle' : 'Beyond Code'}</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {locale === 'fr' ? 'Loisirs & Intérêts' : 'Hobbies & Interests'}
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={80}>
              <HobbiesSection />
            </FadeIn>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            GITHUB
        ══════════════════════════════════════════════════════ */}
        <section id="github" className="py-32">
          <div className="mx-auto w-full max-w-6xl px-6 space-y-16">
            <FadeIn>
              <div className="space-y-4">
                <SectionLabel>Open Source</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {locale === 'fr' ? 'Activité GitHub' : 'GitHub Activity'}
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={80}>
              <GitHubSection />
            </FadeIn>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════ */}
        <div id="testimonials">
          <FadeIn>
            <TestimonialsSection />
          </FadeIn>
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6"><div className="h-px bg-linear-to-r from-transparent via-border/60 to-transparent" /></div>

        {/* ══════════════════════════════════════════════════════
            CONTACT
        ══════════════════════════════════════════════════════ */}
        <section id="contact" className="py-32 pb-40">
          <div className="mx-auto w-full max-w-2xl px-6 space-y-14">
            <FadeIn>
              <div className="space-y-4 text-center">
                <SectionLabel>{locale === 'fr' ? 'Travaillons ensemble' : "Let's Work Together"}</SectionLabel>
                <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {locale === 'fr' ? 'Contactez-moi' : 'Get In Touch'}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {locale === 'fr'
                    ? "Une idée de projet ? Je suis ouvert aux opportunités."
                    : "Have a project idea? I'm open to opportunities."}
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={80}>
              <ContactForm />
            </FadeIn>
          </div>
        </section>
      </main>

      <MediaGalleryDialog
        open={mediaDialog.open}
        onOpenChange={(open) => setMediaDialog((prev) => ({ ...prev, open }))}
        title={mediaDialog.title}
        media={mediaDialog.media}
      />
    </>
  );
}

// ─── Experience Card (drawer style) ─────────────────────────────────────────

function ExperienceCard({
  item,
  isExpanded,
  onToggle,
  formatDateRange,
  calculateDuration,
  ta,
  openMedia,
}: {
  item: Experience;
  isExpanded: boolean;
  onToggle: () => void;
  formatDateRange: (s: string | null, e: string | null) => string;
  calculateDuration: (s: string | null, e: string | null) => string;
  ta: any;
  openMedia: (title: string, media: ExperienceMedia[]) => void;
}) {
  const isActive = !item.endDate && !!item.startDate;
  const period = formatDateRange(item.startDate, item.endDate);
  const duration = calculateDuration(item.startDate, item.endDate);

  return (
    <div
      className={`rounded-2xl border bg-card/50 dark:bg-card/30 backdrop-blur-sm transition-all duration-200 ${
        isActive
          ? 'border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]'
          : 'border-border/40 hover:border-border/70'
      }`}
    >
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={onToggle}
      >
        {/* Logo */}
        {item.logo ? (
          <img src={item.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover border border-border/30 mt-0.5" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-muted/30 text-xs font-bold text-muted-foreground mt-0.5">
            {item.organization.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm">{item.title}</span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {ta('active')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {item.organization}
                {item.jobType && <span className="text-muted-foreground/50"> · {item.jobType}</span>}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform duration-200 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{period}</span>
            {duration && <><span>·</span><span>{duration}</span></>}
            {item.location && <><span>·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span></>}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <div
        style={{
          maxHeight: isExpanded ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className="px-5 pb-5 pt-0 border-t border-border/30 space-y-3">
          <div className="h-3" />
          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          )}
          {item.location && (
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {item.location}
            </p>
          )}
          {item.media.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 h-8 text-xs"
              onClick={(e) => { e.stopPropagation(); openMedia(item.title, item.media); }}
            >
              <Images className="h-3.5 w-3.5" />
              {ta('viewMedia')} ({item.media.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Projects Timeline ───────────────────────────────────────────────────────

function ProjectsTimeline({ projects, locale, repoByUrl, skillIcons }: { projects: Project[]; locale: string; repoByUrl: Map<string, GithubRepo>; skillIcons: Record<string, string> }) {
  return (
    <div className="relative">
      {/* Center vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-border/50 to-transparent hidden md:block" />

      <div className="space-y-10">
        {projects.map((project, index) => {
          const isLeft = index % 2 === 0;
          const isActive = !project.endDate && !!project.startDate;
          const startYear = project.startDate ? new Date(project.startDate).getFullYear() : null;
          const endYear = project.endDate ? new Date(project.endDate).getFullYear() : null;

          return (
            <FadeIn key={project.id} delay={index * 40}>
              <div className="relative md:flex md:items-start">
                {/* Dot */}
                <div
                  className={`absolute left-1/2 top-7 -translate-x-1/2 z-10 hidden md:flex h-4 w-4 items-center justify-center rounded-full border-2 border-background shadow ${
                    project.featured ? 'bg-yellow-500' : 'bg-primary'
                  }`}
                >
                  {project.featured && <Star className="h-2 w-2 text-white" />}
                </div>

                {/* Card */}
                <div
                  className={`group w-full rounded-2xl border border-border/40 bg-card/50 dark:bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 md:w-[46%] ${
                    isLeft ? 'md:mr-auto' : 'md:ml-auto'
                  }`}
                >
                  {(project.thumbnail || project.icon) && (
                    <div className="relative h-44 bg-muted/20 overflow-hidden">
                      <img
                        src={project.thumbnail || project.icon || ''}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent" />
                    </div>
                  )}

                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {project.featured && <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-1" />}
                        <h3 className="text-base font-semibold leading-tight">{project.title}</h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-muted/40 text-muted-foreground border-border/40'
                        }`}
                      >
                        {isActive
                          ? (locale === 'fr' ? 'Actif' : 'Active')
                          : (locale === 'fr' ? 'Terminé' : 'Completed')}
                      </span>
                    </div>

                    {startYear && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {startYear}
                          {isActive ? ` — ${locale === 'fr' ? 'présent' : 'present'}` : endYear && endYear !== startYear ? ` — ${endYear}` : ''}
                        </span>
                      </div>
                    )}

                    {project.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{project.excerpt}</p>
                    )}

                    <TechStackBadges
                      technologies={project.technologies}
                      skillIcons={skillIcons}
                      languageStats={project.githubUrl ? repoByUrl.get(project.githubUrl)?.languageStats : undefined}
                      max={5}
                    />

                    <div className="flex items-center gap-2 pt-0.5">
                      <Button asChild size="sm" className="rounded-xl h-8 text-xs gap-1.5 px-4">
                        <NextLink href={`/projects/${project.slug}`}>
                          {locale === 'fr' ? 'Voir les détails' : 'View Details'}
                          <ArrowRight className="h-3 w-3" />
                        </NextLink>
                      </Button>
                      {project.githubUrl && (
                        <Button asChild size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0 border-border/40">
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <Github className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {project.liveUrl && (
                        <Button asChild size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0 border-border/40">
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" aria-label="Live demo">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
