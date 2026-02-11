'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadsApi } from '../api/uploadsApi';
import type { UploadedFile } from '../lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  aspect?: 'square' | 'video' | 'banner';
  className?: string;
};

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
function isImage(name: string) {
  return IMAGE_EXTS.some((ext) => name.toLowerCase().endsWith(ext));
}

const ASPECT_CLASSES = {
  square: 'aspect-square',
  video: 'aspect-video',
  banner: 'aspect-[1200/630]',
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  aspect = 'video',
  className,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    try {
      setUploading(true);
      const result = await uploadsApi.upload(file);
      onChange(result.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    setLoadingFiles(true);
    try {
      const files = await uploadsApi.list();
      setExistingFiles(files.filter((f) => isImage(f.name)));
    } catch {
      toast.error('Failed to load uploads');
    } finally {
      setLoadingFiles(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {value ? (
        <div className={cn('relative overflow-hidden rounded-lg border bg-muted/30', ASPECT_CLASSES[aspect])}>
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openPicker}
            >
              <Images className="mr-1 h-3.5 w-3.5" />
              Browse
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-start gap-2 text-muted-foreground"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload image'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-muted-foreground"
            onClick={openPicker}
          >
            <Images className="h-4 w-4" />
            Browse
          </Button>
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {/* Image Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose an uploaded image</DialogTitle>
          </DialogHeader>
          {loadingFiles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : existingFiles.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No images uploaded yet. Upload one first.
            </p>
          ) : (
            <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {existingFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                    value === file.url
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                  onClick={() => {
                    onChange(file.url);
                    setPickerOpen(false);
                  }}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
