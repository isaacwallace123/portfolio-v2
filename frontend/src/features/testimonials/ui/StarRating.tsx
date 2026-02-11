'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
};

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const handleClick = (starIndex: number, isLeftHalf: boolean) => {
    if (readonly || !onChange) return;
    const newValue = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(newValue === value ? 0 : newValue);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverValue(isLeftHalf ? starIndex + 0.5 : starIndex + 1);
  };

  return (
    <div
      className={cn('flex gap-0.5', !readonly && 'cursor-pointer')}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fillPercent = Math.min(1, Math.max(0, displayValue - starIndex));

        return (
          <div
            key={starIndex}
            className="relative"
            style={{ width: size, height: size }}
            onMouseMove={(e) => handleMouseMove(e, starIndex)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeftHalf = e.clientX - rect.left < rect.width / 2;
              handleClick(starIndex, isLeftHalf);
            }}
          >
            {/* Empty star (background) */}
            <Star
              size={size}
              className="absolute inset-0 text-muted-foreground/30"
              strokeWidth={1.5}
            />
            {/* Filled portion */}
            {fillPercent > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent * 100}%` }}
              >
                <Star
                  size={size}
                  className="text-yellow-500 fill-yellow-500"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
