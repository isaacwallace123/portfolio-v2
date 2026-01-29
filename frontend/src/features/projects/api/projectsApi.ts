import type { Project, CreateProjectDto, UpdateProjectDto } from '../lib/types';

export const projectsApi = {
  async getAll(published?: boolean): Promise<Project[]> {
    const url = published !== undefined 
      ? `/api/projects?published=${published}` 
      : '/api/projects';
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getById(id: string): Promise<Project> {
    const response = await fetch(`/api/projects?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  async getBySlug(slug: string): Promise<Project> {
    const response = await fetch(`/api/projects?slug=${slug}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    
    return response.json();
  },

  async update(data: UpdateProjectDto): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/projects?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete project');
  },

  async togglePublish(id: string, published: boolean): Promise<Project> {
    return this.update({ id, published });
  },

  async toggleFeature(id: string, featured: boolean): Promise<Project> {
    return this.update({ id, featured });
  },
};
