'use client';

import { useState, useEffect, useCallback } from 'react';
import { githubApi } from '../api/githubApi';
import type { GithubStats } from '../lib/types';

export function useGithubStats() {
  const [stats, setStats] = useState<GithubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached data from DB (GET)
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await githubApi.getStats();
      setStats(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch GitHub stats';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch fresh data from GitHub API and store in DB (POST)
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await githubApi.refresh();
      setStats(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh GitHub data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refresh };
}
