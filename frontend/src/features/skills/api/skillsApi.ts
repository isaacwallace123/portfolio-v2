import type { Skill, CreateSkillDto, UpdateSkillDto } from '../lib/types';

const BASE_URL = '/api/skills';

export const skillsApi = {
  async getAll(): Promise<Skill[]> {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch skills');
    return response.json();
  },

  async create(data: CreateSkillDto): Promise<Skill> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create skill');
    }
    return response.json();
  },

  async update(id: string, data: UpdateSkillDto): Promise<Skill> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update skill');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete skill');
    }
  },
};
