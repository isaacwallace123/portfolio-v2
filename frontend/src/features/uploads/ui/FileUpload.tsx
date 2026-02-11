'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadsApi } from '../api/uploadsApi';
import { toast } from 'sonner';
import type { UploadResult } from '../lib/types';

type FileUploadProps = {
  onUploaded?: (result: UploadResult) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export function FileUpload({
  onUploaded,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 10 * 1024 * 1024,
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        toast.error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
        return;
      }

      try {
        setUploading(true);
        const result = await uploadsApi.upload(file);
        setPreview({
          url: result.url,
          name: result.originalName,
        });
        onUploaded?.(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload';
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const clearPreview = () => {
    setPreview(null);
  };

  if (preview) {
    const isImage = IMAGE_TYPES.some((t) =>
      preview.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
    );

    return (
      <div className={cn('relative rounded-lg border bg-muted/30 p-3', className)}>
        <div className="flex items-center gap-3">
          {isImage ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{preview.name}</p>
            <p className="text-xs text-muted-foreground">{preview.url}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        uploading && 'pointer-events-none opacity-60',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <>
          <div className="mb-2 rounded-full bg-muted p-3">
            {accept.startsWith('image') ? (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm font-medium">
            Drop a file here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {maxSize / 1024 / 1024}MB
          </p>
        </>
      )}
    </div>
  );
}
