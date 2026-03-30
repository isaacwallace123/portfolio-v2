import type { ContactMessage, CreateContactDto, UpdateContactDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';
import axios from 'axios';

const BASE_URL = '/api/contacts';

export const contactsApi = {
  async getAll(): Promise<ContactMessage[]> {
    const { data } = await apiClient.get<ContactMessage[]>(BASE_URL);
    return data;
  },

  async submit(payload: CreateContactDto): Promise<ContactMessage> {
    try {
      const { data } = await apiClient.post<ContactMessage>(BASE_URL, payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as { error?: string; details?: { message: string }[] } | undefined;
        const detail = body?.details?.[0]?.message;
        throw new Error(detail ?? body?.error ?? 'Failed to send message');
      }
      throw error;
    }
  },

  async update(id: string, payload: UpdateContactDto): Promise<ContactMessage> {
    try {
      const { data } = await apiClient.put<ContactMessage>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update contact'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete contact'));
    }
  },
};
