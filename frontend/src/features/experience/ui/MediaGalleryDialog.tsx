'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ExperienceMedia } from '../lib/types';

type MediaGalleryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  media: ExperienceMedia[];
};

export function MediaGalleryDialog({ open, onOpenChange, title, media }: MediaGalleryDialogProps) {
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Reset to first image when dialog opens
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const active = container.children[index] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index]);

  const prev = useCallback(() => setIndex((i) => (i - 1 + media.length) % media.length), [media.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % media.length), [media.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, prev, next]);

  const current = media[index];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-black outline-none"
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0 bg-linear-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
            <div>
              <p className="text-sm font-semibold text-white drop-shadow">{title}</p>
              <p className="text-xs text-white/50">{index + 1} / {media.length}</p>
            </div>
            <DialogPrimitive.Close className="text-white/70 hover:text-white transition-colors rounded-full p-2 hover:bg-white/10 cursor-pointer">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          {/* Main image area */}
          <div className="flex-1 relative flex items-center justify-center min-h-0">
            <img
              key={current.id}
              src={current.url}
              alt={current.caption || title}
              className="max-w-full max-h-full object-contain select-none animate-in fade-in-0 duration-150 px-16"
              draggable={false}
            />

            {/* Prev */}
            {media.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-all backdrop-blur-sm hover:scale-105 cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next */}
            {media.length > 1 && (
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/25 text-white p-3 transition-all backdrop-blur-sm hover:scale-105 cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div className="shrink-0 px-4 pb-5 pt-3 space-y-3 bg-linear-to-t from-black/80 to-transparent">
            {current.caption && (
              <p className="text-sm text-white/80 text-center px-8 leading-relaxed">{current.caption}</p>
            )}

            {/* Thumbnail strip */}
            {media.length > 1 && (
              <div
                ref={thumbsRef}
                className="flex gap-2 justify-start overflow-x-auto pb-1 px-2 scroll-smooth
                  [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-2xl mx-auto"
              >
                {media.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => setIndex(i)}
                    className={`shrink-0 h-14 w-20 rounded-md overflow-hidden transition-all border-2 cursor-pointer ${
                      i === index
                        ? 'border-white opacity-100 scale-105'
                        : 'border-transparent opacity-40 hover:opacity-75'
                    }`}
                  >
                    <img src={item.url} alt="" className="h-full w-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
