import type { Testimonial, CreateTestimonialDto, UpdateTestimonialDto } from '../lib/types';

const BASE_URL = '/api/testimonials';

export const testimonialsApi = {
  async getApproved(): Promise<Testimonial[]> {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    return response.json();
  },

  async getAll(): Promise<Testimonial[]> {
    const response = await fetch(`${BASE_URL}?all=true`);
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    return response.json();
  },

  async create(data: CreateTestimonialDto): Promise<Testimonial> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit testimonial');
    }
    return response.json();
  },

  async update(id: string, data: UpdateTestimonialDto): Promise<Testimonial> {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update testimonial');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete testimonial');
    }
  },
};
