import type { Project, CreateProjectDto, UpdateProjectDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/projects';

export const projectsApi = {
  async getAll(published?: boolean): Promise<Project[]> {
    const { data } = await apiClient.get<Project[]>(BASE_URL, {
      params: published !== undefined ? { published } : undefined,
    });
    return data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await apiClient.get<Project>(BASE_URL, { params: { id } });
    return data;
  },

  async getBySlug(slug: string): Promise<Project> {
    const { data } = await apiClient.get<Project>(BASE_URL, { params: { slug } });
    return data;
  },

  async create(payload: CreateProjectDto): Promise<Project> {
    try {
      const { data } = await apiClient.post<Project>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create project'));
    }
  },

  async update(id: string, payload: UpdateProjectDto): Promise<Project> {
    try {
      const { data } = await apiClient.put<Project>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update project'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete project'));
    }
  },

  async togglePublish(id: string, published: boolean): Promise<Project> {
    return this.update(id, { published });
  },

  async toggleFeature(id: string, featured: boolean): Promise<Project> {
    return this.update(id, { featured });
  },
};
