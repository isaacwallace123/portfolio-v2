import type { Hobby, CreateHobbyDto, UpdateHobbyDto } from '../lib/types';

const BASE_URL = '/api/hobbies';

export const hobbiesApi = {
  async getAll(): Promise<Hobby[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch hobbies');
    return res.json();
  },

  async create(data: CreateHobbyDto): Promise<Hobby> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create hobby');
    }
    return res.json();
  },

  async update(id: string, data: UpdateHobbyDto): Promise<Hobby> {
    const res = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update hobby');
    }
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete hobby');
    }
  },

  async reorder(ids: string[]): Promise<void> {
    const res = await fetch(`${BASE_URL}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reorder hobbies');
    }
  },
};
