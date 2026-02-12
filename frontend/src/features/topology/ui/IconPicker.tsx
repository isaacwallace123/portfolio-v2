'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { uploadsApi } from '@/features/uploads/api/uploadsApi';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IconPickerProps {
  currentIcon: string | null;
  onSelect: (iconPath: string) => void;
}

export function IconPicker({ currentIcon, onSelect }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    uploadsApi
      .list('icons')
      .then((files) => setIcons(files.map((f) => f.url)))
      .catch(() => toast.error('Failed to load icons'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      setUploading(true);
      const result = await uploadsApi.upload(file, 'icons');
      setIcons((prev) => [...prev, result.url]);
      onSelect(result.url);
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload icon';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const filtered = icons.filter((path) => {
    const name = path.split('/').pop()?.replace(/\.\w+$/, '') || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden border hover:border-primary/50 transition-colors shrink-0">
          {currentIcon ? (
            <Image src={currentIcon} alt="" width={20} height={20} unoptimized />
          ) : (
            <span className="text-[10px] text-muted-foreground">?</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" side="right">
        <div className="flex gap-1.5 mb-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-7 w-7 shrink-0 rounded-md border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
            title="Upload custom icon"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
        <ScrollArea className="h-48">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {search ? 'No icons match your search' : 'No icons found'}
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-1.5">
              {filtered.map((iconPath) => (
                <button
                  key={iconPath}
                  onClick={() => {
                    onSelect(iconPath);
                    setOpen(false);
                  }}
                  className={`w-9 h-9 rounded-md flex items-center justify-center border transition-colors hover:border-primary ${
                    currentIcon === iconPath ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                  }`}
                  title={iconPath.split('/').pop()?.replace(/\.\w+$/, '')}
                >
                  <Image src={iconPath} alt="" width={20} height={20} unoptimized />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
