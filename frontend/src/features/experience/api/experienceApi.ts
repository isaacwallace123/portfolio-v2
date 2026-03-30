import type { Experience, CreateExperienceDto, UpdateExperienceDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/experience';

export const experienceApi = {
  async getAll(type?: string): Promise<Experience[]> {
    const { data } = await apiClient.get<Experience[]>(BASE_URL, {
      params: type ? { type } : undefined,
    });
    return data;
  },

  async getById(id: string): Promise<Experience> {
    const { data } = await apiClient.get<Experience>(BASE_URL, { params: { id } });
    return data;
  },

  async create(payload: CreateExperienceDto): Promise<Experience> {
    try {
      const { data } = await apiClient.post<Experience>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create experience'));
    }
  },

  async update(id: string, payload: UpdateExperienceDto): Promise<Experience> {
    try {
      const { data } = await apiClient.put<Experience>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update experience'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete experience'));
    }
  },
};
