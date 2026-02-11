'use client';

import { Linkedin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { StarRating } from './StarRating';
import type { Testimonial } from '../lib/types';

type TestimonialCardProps = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const initials = testimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{testimonial.name}</p>
            {testimonial.linkedin && (
              <a
                href={testimonial.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`${testimonial.name}'s LinkedIn`}
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {testimonial.role && (
            <p className="truncate text-sm text-muted-foreground">{testimonial.role}</p>
          )}
        </div>
      </div>
      <StarRating value={testimonial.rating} readonly size={16} />
      <p className="text-sm leading-relaxed text-muted-foreground">{testimonial.message}</p>
    </Card>
  );
}
