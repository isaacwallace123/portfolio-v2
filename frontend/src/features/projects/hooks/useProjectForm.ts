import { useState } from 'react';
import { projectsApi } from '../api/projectsApi';
import type { CreateProjectDto, UpdateProjectDto, Project } from '../lib/types';
import { toast } from 'sonner';

export function useProjectForm() {
  const [saving, setSaving] = useState(false);

  const createProject = async (data: CreateProjectDto): Promise<Project | null> => {
    try {
      setSaving(true);
      const project = await projectsApi.create(data);
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (id: string, data: UpdateProjectDto): Promise<Project | null> => {
    try {
      setSaving(true);
      const project = await projectsApi.update(id, data);
      toast.success('Project updated successfully!');
      return project;
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    createProject,
    updateProject,
  };
}