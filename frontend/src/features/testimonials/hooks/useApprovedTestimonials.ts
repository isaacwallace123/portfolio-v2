'use client';

import { useState, useEffect } from 'react';
import { testimonialsApi } from '../api/testimonialsApi';
import type { Testimonial } from '../lib/types';

export function useApprovedTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsApi.getApproved();
      setTestimonials(data);
    } catch {
      // Silently fail for public display
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return {
    testimonials,
    loading,
    refresh: fetchTestimonials,
  };
}
