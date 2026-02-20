import { getLanguageColor } from '../lib/languageUtils';

interface LanguageIconProps {
  name: string;
  /** Size in pixels — rendered as both width and height (default 14) */
  size?: number;
  className?: string;
}

/**
 * Colored dot fallback for languages with no locally-cached icon.
 * Icons are served from the site's own storage via TechStackBadges + ensureSkillIcons.
 */
export function LanguageIcon({ name, size = 14, className = '' }: LanguageIconProps) {
  const color = getLanguageColor(name);
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{ width: size - 2, height: size - 2, backgroundColor: color }}
    />
  );
}
