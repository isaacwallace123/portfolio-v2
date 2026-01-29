'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '../api/projectsApi';
import type { CreateProjectDto, UpdateProjectDto, Project } from '../lib/types';
import { toast } from 'sonner';

export function useProjectForm(initialData?: Project) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const createProject = async (data: CreateProjectDto) => {
    try {
      setSaving(true);
      const project = await projectsApi.create(data);
      toast.success('Project created successfully');
      router.push('/admin/projects');
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (data: UpdateProjectDto) => {
    try {
      setSaving(true);
      const project = await projectsApi.update(data);
      toast.success('Project updated successfully');
      return project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      toast.error(message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async (data: CreateProjectDto | UpdateProjectDto) => {
    if ('id' in data && data.id) {
      return updateProject(data);
    } else {
      return createProject(data as CreateProjectDto);
    }
  };

  return {
    saving,
    createProject,
    updateProject,
    saveProject,
  };
}
