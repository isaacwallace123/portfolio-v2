import { NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';
import { prisma } from '@/lib/prisma';

type GithubRepoRaw = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
  private: boolean;
};

async function getSettingValue(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

function githubHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'PortfolioV2',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// GET — public, returns cached GitHub data from DB
export async function GET() {
  try {
    const [reposJson, languagesJson] = await Promise.all([
      getSettingValue('github_cache_repos'),
      getSettingValue('github_cache_languages'),
    ]);

    const repos = reposJson ? JSON.parse(reposJson) : [];
    const languages = languagesJson ? JSON.parse(languagesJson) : [];

    return NextResponse.json({ repos, languages });
  } catch (err) {
    console.error('GitHub cache read error:', err);
    return NextResponse.json({ error: 'Failed to read GitHub data' }, { status: 500 });
  }
}

// POST — admin only, fetches fresh data from GitHub API and stores in DB
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const username = await getSettingValue('github_username');
    if (!username) {
      return NextResponse.json(
        { error: 'GitHub username not configured' },
        { status: 400 }
      );
    }

    const token = await getSettingValue('github_token');
    const headers = githubHeaders(token);

    // Fetch repos — use /user/repos when authenticated (includes private repos)
    const reposEndpoint = token
      ? `https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all&affiliation=owner`
      : `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`;

    const reposRes = await fetch(reposEndpoint, { headers, cache: 'no-store' });

    if (!reposRes.ok) {
      const text = await reposRes.text();
      console.error('GitHub repos API error:', reposRes.status, text);
      return NextResponse.json(
        { error: `GitHub API error: ${reposRes.status}` },
        { status: 502 }
      );
    }

    const rawRepos: GithubRepoRaw[] = await reposRes.json();
    const ownRepos = rawRepos.filter((r) => !r.fork);

    // Fetch languages for each repo in parallel
    const langResults = await Promise.all(
      ownRepos.map(async (repo) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`,
            { headers, cache: 'no-store' }
          );
          if (!res.ok) return {};
          return (await res.json()) as Record<string, number>;
        } catch {
          return {};
        }
      })
    );

    const repos = ownRepos.map((r, i) => {
      const langMap = langResults[i] || {};
      const repoTotalBytes = Object.values(langMap).reduce((a, b) => a + b, 0);
      const languageStats = Object.entries(langMap)
        .map(([language, bytes]) => ({
          language,
          bytes,
          percentage: repoTotalBytes > 0 ? Math.round((bytes / repoTotalBytes) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.bytes - a.bytes);

      return {
        name: r.name,
        description: r.description,
        language: r.language,
        html_url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updated_at: r.updated_at,
        private: r.private,
        languages: Object.keys(langMap),
        languageStats,
      };
    });

    // Aggregate language bytes across all repos
    const totals: Record<string, number> = {};
    for (const langMap of langResults) {
      for (const [lang, bytes] of Object.entries(langMap)) {
        totals[lang] = (totals[lang] || 0) + bytes;
      }
    }

    const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0);

    const languages = Object.entries(totals)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);

    // Store in DB
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'github_cache_repos' },
        update: { value: JSON.stringify(repos) },
        create: { key: 'github_cache_repos', value: JSON.stringify(repos) },
      }),
      prisma.setting.upsert({
        where: { key: 'github_cache_languages' },
        update: { value: JSON.stringify(languages) },
        create: { key: 'github_cache_languages', value: JSON.stringify(languages) },
      }),
    ]);

    return NextResponse.json({ repos, languages });
  } catch (err) {
    console.error('GitHub refresh error:', err);
    return NextResponse.json({ error: 'Failed to refresh GitHub data' }, { status: 500 });
  }
}
