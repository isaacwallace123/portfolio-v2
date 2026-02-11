'use client';

import { useState, useEffect, useCallback } from 'react';
import { experienceApi } from '../api/experienceApi';
import type { Experience, CreateExperienceDto, UpdateExperienceDto } from '../lib/types';
import { toast } from 'sonner';

export function useExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperiences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await experienceApi.getAll();
      setExperiences(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load experience';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const createExperience = async (data: CreateExperienceDto) => {
    try {
      await experienceApi.create(data);
      toast.success('Experience created');
      await fetchExperiences();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create experience';
      toast.error(message);
    }
  };

  const updateExperience = async (id: string, data: UpdateExperienceDto) => {
    try {
      await experienceApi.update(id, data);
      toast.success('Experience updated');
      await fetchExperiences();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update experience';
      toast.error(message);
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      await experienceApi.delete(id);
      toast.success('Experience deleted');
      await fetchExperiences();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete experience';
      toast.error(message);
    }
  };

  return {
    experiences,
    loading,
    error,
    refresh: fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
  };
}
