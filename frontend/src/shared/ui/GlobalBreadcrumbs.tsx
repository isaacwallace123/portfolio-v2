'use client';

import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';

export function GlobalBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('breadcrumbs');

  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  if (segments[0] === 'admin') {
    return null;
  }

  const routeLabels: Record<string, string> = {
    'projects': t('projects'),
    'about': t('about'),
    'contact': t('contact'),
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-3">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('home')}
          </Link>

          {segments.map((segment, index) => {
            const href = '/' + segments.slice(0, index + 1).join('/');
            const isLast = index === segments.length - 1;

            const decodedSegment = decodeURIComponent(segment);

            const label = routeLabels[segment] ||
              decodedSegment
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            return (
              <div key={href} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {isLast ? (
                  <span className="text-foreground font-medium truncate max-w-50">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-50"
                  >
                    {label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
