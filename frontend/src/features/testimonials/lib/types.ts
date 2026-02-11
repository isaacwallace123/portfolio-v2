export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
  linkedin: string | null;
  message: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

export type CreateTestimonialDto = {
  name: string;
  role?: string;
  avatar?: string;
  linkedin?: string;
  message: string;
  rating: number;
};

export type UpdateTestimonialDto = Partial<CreateTestimonialDto> & {
  status?: 'pending' | 'approved' | 'rejected';
};
