'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CVMetadata } from '../lib/types';
import apiClient from '@/lib/apiClient';

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
        const { data } = await apiClient.get<CVMetadata>('/api/settings/public/cv', { params: { locale } });
        setCv(data);
      } catch {
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
