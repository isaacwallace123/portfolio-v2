'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { TocItem } from '../lib/toc';

function stripEmojis(text: string): string {
  return text.replace(/\p{Emoji}/gu, '').replace(/\s+/g, ' ').trim();
}
// TocItem is a plain interface — safe to import from lib

export type { TocItem } from '../lib/toc';

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Contents
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              'block py-1.5 text-sm border-l-2 transition-colors',
              item.level === 1 ? 'pl-3' : item.level === 2 ? 'pl-6' : 'pl-9',
              activeId === item.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {stripEmojis(item.text)}
          </a>
        ))}
      </div>
    </nav>
  );
}
