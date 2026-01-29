import type { Project, CreateProjectDto, UpdateProjectDto } from '../lib/types';

const BASE_URL = '/api/projects';

export const projectsApi = {
  async getAll(published?: boolean): Promise<Project[]> {
    const params = new URLSearchParams();
    if (published !== undefined) {
      params.append('published', published.toString());
    }
    
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<Project> {
    const response = await fetch(`${BASE_URL}?id=${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    
    return response.json();
  },

  async getBySlug(slug: string): Promise<Project> {
    const response = await fetch(`${BASE_URL}?slug=${slug}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    
    return response.json();
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const response = await fetch(BASE_URL, {
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

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  },

  // FIXED: These functions now properly pass the ID
  async togglePublish(id: string, published: boolean): Promise<Project> {
    return this.update(id, { published });
  },

  async toggleFeature(id: string, featured: boolean): Promise<Project> {
    return this.update(id, { featured });
  },
};