'use client';

import { useState, useEffect } from 'react';
import { hobbiesApi } from '../api/hobbiesApi';
import type { Hobby, CreateHobbyDto, UpdateHobbyDto } from '../lib/types';
import { toast } from 'sonner';

export function useHobbies() {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHobbies = async () => {
    try {
      setLoading(true);
      const data = await hobbiesApi.getAll();
      setHobbies(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load hobbies';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHobbies();
  }, []);

  const createHobby = async (data: CreateHobbyDto) => {
    try {
      const hobby = await hobbiesApi.create(data);
      toast.success('Hobby created');
      await fetchHobbies();
      return hobby;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create hobby';
      toast.error(message);
      throw err;
    }
  };

  const updateHobby = async (id: string, data: UpdateHobbyDto) => {
    try {
      await hobbiesApi.update(id, data);
      toast.success('Hobby updated');
      await fetchHobbies();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update hobby';
      toast.error(message);
      throw err;
    }
  };

  const deleteHobby = async (id: string) => {
    try {
      await hobbiesApi.delete(id);
      toast.success('Hobby deleted');
      await fetchHobbies();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete hobby';
      toast.error(message);
      throw err;
    }
  };

  const reorderHobbies = async (ids: string[]) => {
    try {
      // Optimistic update
      const reordered = ids.map((id, index) => {
        const hobby = hobbies.find((h) => h.id === id);
        return hobby ? { ...hobby, order: index } : null;
      }).filter(Boolean) as Hobby[];

      setHobbies(reordered);
      await hobbiesApi.reorder(ids);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder hobbies';
      toast.error(message);
      await fetchHobbies(); // Revert on error
      throw err;
    }
  };

  return {
    hobbies,
    loading,
    createHobby,
    updateHobby,
    deleteHobby,
    reorderHobbies,
    refresh: fetchHobbies,
  };
}
