import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../lib/types';

const BASE_URL = '/api/categories';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create category');
    }
    return response.json();
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update category');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete category');
    }
  },

  async reorder(ids: string[]): Promise<void> {
    const response = await fetch(`${BASE_URL}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reorder categories');
    }
  },
};
