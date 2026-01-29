'use client';

import { useState, useEffect } from 'react';
import { projectsApi } from '../api/projectsApi';
import type { Project } from '../lib/types';
import { toast } from 'sonner';

export function useProjects(published?: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAll(published);
      setProjects(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [published]);

  const deleteProject = async (id: string) => {
    try {
      await projectsApi.delete(id);
      toast.success('Project deleted successfully');
      await fetchProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(message);
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    try {
      await projectsApi.togglePublish(id, published);
      toast.success(`Project ${published ? 'published' : 'unpublished'}`);
      await fetchProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(message);
    }
  };

  const toggleFeature = async (id: string, featured: boolean) => {
    try {
      await projectsApi.toggleFeature(id, featured);
      toast.success(`Project ${featured ? 'featured' : 'unfeatured'}`);
      await fetchProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(message);
    }
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    deleteProject,
    togglePublish,
    toggleFeature,
  };
}
