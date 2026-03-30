import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/categories';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>(BASE_URL);
    return data;
  },

  async create(payload: CreateCategoryDto): Promise<Category> {
    try {
      const { data } = await apiClient.post<Category>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create category'));
    }
  },

  async update(id: string, payload: UpdateCategoryDto): Promise<Category> {
    try {
      const { data } = await apiClient.put<Category>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update category'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete category'));
    }
  },

  async reorder(ids: string[]): Promise<void> {
    try {
      await apiClient.post(`${BASE_URL}/reorder`, { ids });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to reorder categories'));
    }
  },
};
