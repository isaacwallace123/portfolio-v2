import type { Experience, CreateExperienceDto, UpdateExperienceDto } from '../lib/types';

const BASE_URL = '/api/experience';

export const experienceApi = {
  async getAll(type?: string): Promise<Experience[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch experience');
    return response.json();
  },

  async getById(id: string): Promise<Experience> {
    const response = await fetch(`${BASE_URL}?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch experience');
    return response.json();
  },

  async create(data: CreateExperienceDto): Promise<Experience> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create experience');
    }
    return response.json();
  },

  async update(id: string, data: UpdateExperienceDto): Promise<Experience> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update experience');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete experience');
    }
  },
};
