'use client';

import { Github, Star, GitFork, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGithubStats } from '../hooks/useGithubStats';
import { LanguageRadarChart } from './LanguageRadarChart';
import { useTranslations, useLocale } from 'next-intl';

export function GitHubSection() {
  const t = useTranslations('github');
  const locale = useLocale();
  const { stats, loading } = useGithubStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.repos.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2">
        <Github className="h-6 w-6" />
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('repositories')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('publicRepos')}</p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('languages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.languages.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('uniqueLanguages')}</p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('topLanguage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.languages[0]?.language || '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.languages[0] ? t('percentOfTotal', { percentage: stats.languages[0].percentage }) : t('noData')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Repos */}
      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        <LanguageRadarChart />

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60 min-w-0">
          <CardHeader>
            <CardTitle>{t('repositories')}</CardTitle>
            <CardDescription>{t('publicGithubRepos')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-100 overflow-y-auto min-w-0">
            {stats.repos.map((repo) => (
              <div
                key={repo.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">{repo.name}</p>
                    {repo.language && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {repo.description}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('updated', { date: formatDate(repo.updated_at) })}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  {repo.stars > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {repo.stars}
                    </span>
                  )}
                  {repo.forks > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <GitFork className="h-3 w-3" />
                      {repo.forks}
                    </span>
                  )}
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
