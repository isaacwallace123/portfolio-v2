import type { Hobby, CreateHobbyDto, UpdateHobbyDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/hobbies';

export const hobbiesApi = {
  async getAll(): Promise<Hobby[]> {
    const { data } = await apiClient.get<Hobby[]>(BASE_URL);
    return data;
  },

  async create(payload: CreateHobbyDto): Promise<Hobby> {
    try {
      const { data } = await apiClient.post<Hobby>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create hobby'));
    }
  },

  async update(id: string, payload: UpdateHobbyDto): Promise<Hobby> {
    try {
      const { data } = await apiClient.put<Hobby>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update hobby'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id: encodeURIComponent(id) } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete hobby'));
    }
  },

  async reorder(ids: string[]): Promise<void> {
    try {
      await apiClient.post(`${BASE_URL}/reorder`, { ids });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to reorder hobbies'));
    }
  },
};
