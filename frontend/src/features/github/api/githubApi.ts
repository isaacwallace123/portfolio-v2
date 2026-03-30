import type { GithubStats } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

export const githubApi = {
  async getStats(): Promise<GithubStats> {
    try {
      const { data } = await apiClient.get<GithubStats>('/api/github');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch GitHub stats'));
    }
  },

  async refresh(): Promise<GithubStats> {
    try {
      const { data } = await apiClient.post<GithubStats>('/api/github');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to refresh GitHub data'));
    }
  },
};
