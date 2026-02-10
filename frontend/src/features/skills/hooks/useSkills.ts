'use client';

import { useState, useEffect } from 'react';
import { skillsApi } from '../api/skillsApi';
import type { Skill } from '../lib/types';
import { toast } from 'sonner';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const data = await skillsApi.getAll();
      setSkills(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load skills';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const createSkill = async (data: Parameters<typeof skillsApi.create>[0]) => {
    try {
      await skillsApi.create(data);
      toast.success('Skill added');
      await fetchSkills();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add skill';
      toast.error(message);
    }
  };

  const updateSkill = async (id: string, data: Parameters<typeof skillsApi.update>[1]) => {
    try {
      await skillsApi.update(id, data);
      toast.success('Skill updated');
      await fetchSkills();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update skill';
      toast.error(message);
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      await skillsApi.delete(id);
      toast.success('Skill removed');
      await fetchSkills();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove skill';
      toast.error(message);
    }
  };

  return {
    skills,
    loading,
    error,
    refresh: fetchSkills,
    createSkill,
    updateSkill,
    deleteSkill,
  };
}
