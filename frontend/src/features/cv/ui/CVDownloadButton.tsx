'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CVMetadata } from '../lib/types';

type CVDownloadButtonProps = {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
};

export function CVDownloadButton({
  variant = 'default',
  size = 'default',
  className = '',
}: CVDownloadButtonProps) {
  const locale = useLocale() as 'en' | 'fr';
  const [cv, setCv] = useState<CVMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/settings/public/cv?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setCv(data);
        } else {
          setCv(null);
        }
      } catch (err) {
        console.error('Failed to fetch CV:', err);
        setCv(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCV();
  }, [locale]);

  // Don't render if loading, no CV, or not visible
  if (loading || !cv || !cv.visible) return null;

  const buttonText = locale === 'en' ? 'Download CV' : 'Télécharger CV';

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={cv.filePath} download={cv.fileName}>
        <Download className="mr-2 h-4 w-4" />
        {buttonText}
      </a>
    </Button>
  );
}
