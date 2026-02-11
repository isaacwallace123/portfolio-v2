'use client';

import { useState, useCallback, useEffect } from 'react';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useApprovedTestimonials } from '../hooks/useApprovedTestimonials';
import { TestimonialCard } from './TestimonialCard';
import { TestimonialForm } from './TestimonialForm';
import { cn } from '@/lib/utils';

export function TestimonialsSection() {
  const { testimonials, loading, refresh } = useApprovedTestimonials();
  const [formOpen, setFormOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

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
        ) : testimonials.length > 0 && testimonials.length <= 3 ? (
          <div className="grid justify-center gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        ) : testimonials.length > 3 ? (
          <div className="px-10">
            <Carousel
              setApi={setApi}
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                }),
              ]}
            >
              <CarouselContent>
                {testimonials.map((t) => (
                  <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/3">
                    <TestimonialCard testimonial={t} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            {/* Dot indicators */}
            {count > 1 && (
              <div className="mt-6 flex justify-center gap-1.5">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      current === i
                        ? 'w-6 bg-primary'
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                    onClick={() => api?.scrollTo(i)}
                  />
                ))}
              </div>
            )}
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
