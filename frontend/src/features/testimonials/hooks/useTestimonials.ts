'use client';

import { useState, useEffect } from 'react';
import { testimonialsApi } from '../api/testimonialsApi';
import type { Testimonial } from '../lib/types';
import { toast } from 'sonner';

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsApi.getAll();
      setTestimonials(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load testimonials';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const updateTestimonial = async (id: string, data: Parameters<typeof testimonialsApi.update>[1]) => {
    try {
      await testimonialsApi.update(id, data);
      toast.success('Testimonial updated');
      await fetchTestimonials();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update testimonial';
      toast.error(message);
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await testimonialsApi.delete(id);
      toast.success('Testimonial deleted');
      await fetchTestimonials();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete testimonial';
      toast.error(message);
    }
  };

  const approveTestimonial = async (id: string) => {
    await updateTestimonial(id, { status: 'approved' });
  };

  const rejectTestimonial = async (id: string) => {
    await updateTestimonial(id, { status: 'rejected' });
  };

  return {
    testimonials,
    loading,
    error,
    refresh: fetchTestimonials,
    updateTestimonial,
    deleteTestimonial,
    approveTestimonial,
    rejectTestimonial,
  };
}
