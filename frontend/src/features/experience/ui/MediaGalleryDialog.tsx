'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExperienceMedia } from '../lib/types';

type MediaGalleryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  media: ExperienceMedia[];
};

export function MediaGalleryDialog({ open, onOpenChange, title, media }: MediaGalleryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto">
          {media.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="aspect-video overflow-hidden rounded-lg border">
                <img
                  src={item.url}
                  alt={item.caption || ''}
                  className="h-full w-full object-cover"
                />
              </div>
              {item.caption && (
                <p className="text-sm text-muted-foreground">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
