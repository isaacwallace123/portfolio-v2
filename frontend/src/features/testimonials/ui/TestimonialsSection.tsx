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
import { useTranslations } from 'next-intl';

export function TestimonialsSection() {
  const t = useTranslations('testimonials');
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('title')}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {t('subtitle')}
            </h2>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl self-start sm:self-auto"
            onClick={() => setFormOpen(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {t('leaveReview')}
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
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : testimonials.length > 3 ? (
          <div className="px-8 sm:px-10">
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
                {testimonials.map((testimonial) => (
                  <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                    <TestimonialCard testimonial={testimonial} />
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
                    aria-label={t('goToSlide', { number: i + 1 })}
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
              {t('noTestimonials')}{' '}
              <button
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => setFormOpen(true)}
              >
                {t('leaveReviewLink')}
              </button>
              !
            </p>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('formTitle')}</DialogTitle>
            <DialogDescription>
              {t('formDescription')}
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
