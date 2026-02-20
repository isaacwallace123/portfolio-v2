'use client';

import { Github, Star, GitFork, ExternalLink, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGithubStats } from '../hooks/useGithubStats';
import { LanguageRadarChart } from './LanguageRadarChart';
import { LanguageIcon } from './LanguageIcon';
import { getLanguageColor } from '../lib/languageUtils';
import { useTranslations, useLocale } from 'next-intl';

export function GitHubSection() {
  const t = useTranslations('github');
  const locale = useLocale();
  const { stats, loading } = useGithubStats();

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.repos.length === 0) return null;

  const topRepos = stats.repos.slice(0, 5);

  const profileUrl = `https://github.com/isaacwallace123`;

  return (
    <div className="space-y-8 min-w-0 overflow-hidden">
      {/* Inline stats strip */}
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.repos.length}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('publicRepos')}</span>
        </div>
        <div className="w-px bg-border/50 self-stretch" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.languages.length}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('uniqueLanguages')}</span>
        </div>
        <div className="w-px bg-border/50 self-stretch" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.languages[0]?.language || '—'}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('topLanguage')}</span>
        </div>
      </div>

      {/* Chart + Repos */}
      <div className="grid gap-8 lg:grid-cols-2 min-w-0">
        <LanguageRadarChart />

        <div className="space-y-1 min-w-0">
          {topRepos.map((repo) => {
            const langs = repo.languageStats?.slice(0, 6) ?? [];
            return (
              <a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium group-hover:text-foreground">
                        {repo.name}
                      </span>
                      {repo.language && (
                        <Badge variant="secondary" className="text-[10px] shrink-0 px-1.5 py-0 flex items-center gap-1">
                          <LanguageIcon name={repo.language} size={12} />
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-0.5 text-xs">
                        <Star className="h-3 w-3" />
                        {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-0.5 text-xs">
                        <GitFork className="h-3 w-3" />
                        {repo.forks}
                      </span>
                    )}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {langs.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                      {langs.map((stat) => (
                        <div
                          key={stat.language}
                          style={{ width: `${stat.percentage}%`, backgroundColor: getLanguageColor(stat.language) }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {langs.map((stat) => (
                        <span key={stat.language} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(stat.language) }} />
                          {stat.language}
                          <span className="opacity-60">{stat.percentage}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </a>
            );
          })}

          <div className="pt-3 pl-4">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              {locale === 'fr' ? 'Voir le profil GitHub' : 'View GitHub Profile'}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
