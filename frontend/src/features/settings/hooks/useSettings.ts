'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../api/settingsApi';
import type { SiteSettings } from '../lib/types';
import { toast } from 'sonner';

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSetting = async (key: string, value: string) => {
    await settingsApi.update(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, loading, updateSetting, refresh };
}
