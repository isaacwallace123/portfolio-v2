import type { SiteSettings } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/settings';

export const settingsApi = {
  async getAll(): Promise<SiteSettings> {
    const { data } = await apiClient.get<SiteSettings>(BASE_URL);
    return data;
  },

  async update(key: string, value: string): Promise<void> {
    try {
      await apiClient.put(BASE_URL, { key, value });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update setting'));
    }
  },
};
