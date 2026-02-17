'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Gamepad2,
  Camera,
  Music,
  Book,
  Plane,
  Coffee,
  Palette,
  Code,
  Dumbbell,
  Film,
  Guitar,
  Bike,
  Mountain,
  Tv,
  Utensils,
  Wine,
  Heart,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { hobbiesApi } from '../api/hobbiesApi';
import type { Hobby } from '../lib/types';
import Image from 'next/image';
import { useLocale } from 'next-intl';

// Icon map for lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2,
  Camera,
  Music,
  Book,
  Plane,
  Coffee,
  Palette,
  Code,
  Dumbbell,
  Film,
  Guitar,
  Bike,
  Mountain,
  Tv,
  Utensils,
  Wine,
  Sparkles,
  Heart,
  Star,
  Zap,
};

export function HobbiesSection() {
  const locale = useLocale();
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const data = await hobbiesApi.getAll();
        setHobbies(data);
      } catch (err) {
        console.error('Failed to fetch hobbies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHobbies();
  }, []);

  if (loading || hobbies.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {hobbies.map((hobby) => {
        const label = locale === 'fr' && hobby.labelFr ? hobby.labelFr : hobby.label;
        const isLucideIcon =
          hobby.icon && !hobby.icon.startsWith('http') && !hobby.icon.startsWith('/');
        const LucideIconComponent = isLucideIcon && hobby.icon ? ICON_MAP[hobby.icon] : null;

        return (
          <div
            key={hobby.id}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-muted bg-background/50 p-6 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
              {hobby.icon && (
                <>
                  {LucideIconComponent ? (
                    <LucideIconComponent className="h-8 w-8 text-primary" />
                  ) : (
                    <Image
                      src={hobby.icon}
                      alt={label}
                      width={32}
                      height={32}
                      className="rounded"
                      unoptimized
                    />
                  )}
                </>
              )}
            </div>
            <span className="text-center font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
