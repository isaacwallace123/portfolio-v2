'use client';

import { useState, useEffect } from 'react';
import { cvApi } from '../api/cvApi';
import type { CVData, CVLocale } from '../lib/types';
import { toast } from 'sonner';

export function useCV() {
  const [cvData, setCvData] = useState<CVData>({ en: null, fr: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<CVLocale | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await cvApi.getAll();
      setCvData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load CV data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const upload = async (file: File, locale: CVLocale) => {
    try {
      setUploading(locale);
      await cvApi.upload(file, locale);
      toast.success(`${locale.toUpperCase()} CV uploaded successfully`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload CV';
      toast.error(message);
    } finally {
      setUploading(null);
    }
  };

  const deleteCv = async (locale: CVLocale) => {
    try {
      await cvApi.delete(locale);
      toast.success(`${locale.toUpperCase()} CV deleted`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete CV';
      toast.error(message);
    }
  };

  const setVisibility = async (locale: CVLocale, visible: boolean) => {
    try {
      await cvApi.setVisibility(locale, visible);
      toast.success(`${locale.toUpperCase()} CV visibility updated`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update visibility';
      toast.error(message);
    }
  };

  return {
    cvData,
    loading,
    uploading,
    upload,
    deleteCv,
    setVisibility,
    refresh,
  };
}
