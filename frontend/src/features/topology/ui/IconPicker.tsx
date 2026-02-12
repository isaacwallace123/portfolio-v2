'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AVAILABLE_ICONS } from '../lib/iconMap';

interface IconPickerProps {
  currentIcon: string | null;
  onSelect: (iconPath: string) => void;
}

export function IconPicker({ currentIcon, onSelect }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = AVAILABLE_ICONS.filter((path) => {
    const name = path.split('/').pop()?.replace('.png', '') || '';
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
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs mb-2"
        />
        <ScrollArea className="h-48">
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
                title={iconPath.split('/').pop()?.replace('.png', '')}
              >
                <Image src={iconPath} alt="" width={20} height={20} unoptimized />
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
