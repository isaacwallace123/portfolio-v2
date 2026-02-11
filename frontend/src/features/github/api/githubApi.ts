import type { GithubStats } from '../lib/types';

export const githubApi = {
  async getStats(): Promise<GithubStats> {
    const res = await fetch('/api/github');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch GitHub stats');
    }
    return res.json();
  },

  async refresh(): Promise<GithubStats> {
    const res = await fetch('/api/github', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to refresh GitHub data');
    }
    return res.json();
  },
};
