import type { Testimonial, CreateTestimonialDto, UpdateTestimonialDto } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/testimonials';

export const testimonialsApi = {
  async getApproved(): Promise<Testimonial[]> {
    const { data } = await apiClient.get<Testimonial[]>(BASE_URL);
    return data;
  },

  async getAll(): Promise<Testimonial[]> {
    const { data } = await apiClient.get<Testimonial[]>(BASE_URL, { params: { all: true } });
    return data;
  },

  async create(payload: CreateTestimonialDto): Promise<Testimonial> {
    try {
      const { data } = await apiClient.post<Testimonial>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to submit testimonial'));
    }
  },

  async update(id: string, payload: UpdateTestimonialDto): Promise<Testimonial> {
    try {
      const { data } = await apiClient.put<Testimonial>(BASE_URL, { id, ...payload });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update testimonial'));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete testimonial'));
    }
  },
};
