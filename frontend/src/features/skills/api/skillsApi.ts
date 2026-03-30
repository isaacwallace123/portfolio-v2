import type { Skill, CreateSkillDto, UpdateSkillDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/skills';

export const skillsApi = {
  async getAll(): Promise<Skill[]> {
    const { data } = await apiClient.get<Skill[]>(BASE_URL);
    return data;
  },

  async create(payload: CreateSkillDto): Promise<Skill> {
    try {
      const { data } = await apiClient.post<Skill>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to create skill'));
    }
  },

  async update(id: string, payload: UpdateSkillDto): Promise<Skill> {
    try {
      const { data } = await apiClient.put<Skill>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update skill'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete skill'));
    }
  },
};
