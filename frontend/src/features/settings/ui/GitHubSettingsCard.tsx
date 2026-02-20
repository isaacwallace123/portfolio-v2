'use client';

import { useState } from 'react';
import { Github, Eye, EyeOff, Save, RefreshCw, Star, GitFork, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useGithubStats } from '@/features/github/hooks/useGithubStats';
import { LanguageRadarChart } from '@/features/github/ui/LanguageRadarChart';
import { LanguageIcon } from '@/features/github/ui/LanguageIcon';
import { getLanguageColor } from '@/features/github/lib/languageUtils';
import { toast } from 'sonner';

export function GitHubSettingsCard() {
  const { settings, loading: settingsLoading, updateSetting } = useSettings();
  const { stats, loading: githubLoading, refresh: refreshGithub } = useGithubStats();

  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usernameInitialized, setUsernameInitialized] = useState(false);
  const [tokenInitialized, setTokenInitialized] = useState(false);

  // Sync local state from loaded settings (once)
  if (!settingsLoading && !usernameInitialized && settings.github_username !== undefined) {
    setUsername(settings.github_username || '');
    setUsernameInitialized(true);
  }
  if (!settingsLoading && !tokenInitialized && settings.github_token !== undefined) {
    setToken(settings.github_token || '');
    setTokenInitialized(true);
  }

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('GitHub username is required');
      return;
    }

    try {
      setSaving(true);
      await updateSetting('github_username', username.trim());
      if (token && !token.includes('••••')) {
        await updateSetting('github_token', token.trim());
      }
      toast.success('Settings saved — click "Refresh Data" to pull from GitHub');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshGithub();
      toast.success('GitHub data refreshed');
    } catch {
      toast.error('Failed to refresh GitHub data');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* GitHub Configuration */}
      <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to display repositories and language stats on your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="github-username">Username *</Label>
              <Input
                id="github-username"
                placeholder="isaacwallace123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={settingsLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">Personal Access Token</Label>
              <div className="relative">
                <Input
                  id="github-token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Optional — increases API rate limit"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={settingsLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. A PAT increases the rate limit from 60 to 5,000 requests/hour.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || settingsLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || githubLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Overview — only show when we have data */}
      {stats && stats.repos.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.repos.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Public repos</p>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.languages.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique languages used</p>
              </CardContent>
            </Card>

            <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.languages[0]?.language || '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.languages[0] ? `${stats.languages[0].percentage}% of total` : 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 min-w-0">
            <LanguageRadarChart />

            <Card className="bg-background/80 backdrop-blur dark:bg-background/60 min-w-0">
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>Your public GitHub repositories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-100 overflow-y-auto min-w-0">
                {stats.repos.map((repo) => (
                  <div
                    key={repo.name}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-sm">{repo.name}</p>
                          {repo.private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          {repo.language && (
                            <Badge variant="secondary" className="text-[10px] shrink-0 flex items-center gap-1">
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
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Updated {formatDate(repo.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
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

                    {repo.languageStats?.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                          {repo.languageStats.slice(0, 6).map((stat) => (
                            <div
                              key={stat.language}
                              style={{ width: `${stat.percentage}%`, backgroundColor: getLanguageColor(stat.language) }}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {repo.languageStats.slice(0, 6).map((stat) => (
                            <span key={stat.language} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(stat.language) }} />
                              {stat.language}
                              <span className="opacity-60">{stat.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
