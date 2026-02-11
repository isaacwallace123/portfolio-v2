'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApprovedTestimonials } from '../hooks/useApprovedTestimonials';
import { TestimonialCard } from './TestimonialCard';
import { TestimonialForm } from './TestimonialForm';

export function TestimonialsSection() {
  const { testimonials, loading, refresh } = useApprovedTestimonials();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="py-14">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Testimonials
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              What people say
            </h2>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setFormOpen(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Leave a review
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              No testimonials yet. Be the first to{' '}
              <button
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => setFormOpen(true)}
              >
                leave a review
              </button>
              !
            </p>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave a review</DialogTitle>
            <DialogDescription>
              Share your experience. Your testimonial will be reviewed before publishing.
            </DialogDescription>
          </DialogHeader>
          <TestimonialForm
            onSubmitted={() => {
              setFormOpen(false);
              refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
