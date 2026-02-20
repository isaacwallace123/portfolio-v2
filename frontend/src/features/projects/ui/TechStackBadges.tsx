'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LanguageIcon } from '@/features/github/ui/LanguageIcon';

interface LanguageStat {
  language: string;
  percentage: number;
}

interface TechStackBadgesProps {
  technologies: string[];
  /**
   * Pre-resolved icon URLs keyed by lowercased tech name (from DB skills).
   * Use a plain Record so this is serializable from server components.
   */
  skillIcons?: Record<string, string>;
  /** GitHub language stats — used to show percentages alongside tech names. */
  languageStats?: LanguageStat[];
  /** Max items to show before a "+N" overflow badge. Omit to show all. */
  max?: number;
  className?: string;
}

export function TechStackBadges({
  technologies,
  skillIcons,
  languageStats,
  max,
  className,
}: TechStackBadgesProps) {
  const pctMap = new Map(
    (languageStats ?? []).map((s) => [s.language.toLowerCase(), s.percentage])
  );

  const badgeClass =
    'flex items-center gap-1.5 rounded-md border border-border/40 bg-background/60 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors';

  // No technologies — fall back to raw GitHub language stats
  if (technologies.length === 0) {
    if (!languageStats || languageStats.length === 0) return null;
    const show = max !== undefined ? languageStats.slice(0, max) : languageStats;
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {show.map((stat) => (
          <span key={stat.language} className={badgeClass}>
            <LanguageIcon name={stat.language} size={13} />
            {stat.language}
            <span className="opacity-60">{stat.percentage}%</span>
          </span>
        ))}
      </div>
    );
  }

  const visible = max !== undefined ? technologies.slice(0, max) : technologies;
  const overflow = technologies.length - visible.length;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((tech) => {
        const iconUrl = skillIcons?.[tech.toLowerCase()];
        const pct = pctMap.get(tech.toLowerCase());
        return (
          <span key={tech} className={badgeClass}>
            {iconUrl
              ? <Image src={iconUrl} alt="" width={13} height={13} className="shrink-0 object-contain" />
              : <LanguageIcon name={tech} size={13} />
            }
            {tech}
            {pct !== undefined && <span className="opacity-60">{pct}%</span>}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="rounded-md border border-border/40 bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
