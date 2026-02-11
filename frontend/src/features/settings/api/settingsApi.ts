import type { SiteSettings } from '../lib/types';

const BASE_URL = '/api/settings';

export const settingsApi = {
  async getAll(): Promise<SiteSettings> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async update(key: string, value: string): Promise<void> {
    const res = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update setting');
    }
  },
};
