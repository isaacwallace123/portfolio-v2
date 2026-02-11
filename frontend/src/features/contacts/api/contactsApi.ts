import type { ContactMessage, CreateContactDto, UpdateContactDto } from '../lib/types';

const BASE_URL = '/api/contacts';

export const contactsApi = {
  async getAll(): Promise<ContactMessage[]> {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  },

  async submit(data: CreateContactDto): Promise<ContactMessage> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json();
      const detail = body.details?.[0]?.message;
      throw new Error(detail || body.error || 'Failed to send message');
    }
    return response.json();
  },

  async update(id: string, data: UpdateContactDto): Promise<ContactMessage> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact');
    }
  },
};
