'use client';

import { useState } from 'react';
import { getDeviconUrl, getLanguageColor } from '../lib/languageUtils';

interface LanguageIconProps {
  name: string;
  /** Size in pixels — rendered as both width and height (default 14) */
  size?: number;
  className?: string;
}

export function LanguageIcon({ name, size = 14, className = '' }: LanguageIconProps) {
  const [failed, setFailed] = useState(false);
  const url = getDeviconUrl(name);
  const color = getLanguageColor(name);

  if (!url || failed) {
    return (
      <span
        className={`inline-block rounded-full shrink-0 ${className}`}
        style={{ width: size - 2, height: size - 2, backgroundColor: color }}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
