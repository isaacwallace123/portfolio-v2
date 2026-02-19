import { randomUUID } from 'crypto';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'divider'
  | 'code'
  | 'callout'
  | 'stats'
  | 'features';

// ─── Per-block prop shapes ────────────────────────────────────────────────────

export interface HeadingProps {
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphProps {
  html: string;
}

export interface ImageProps {
  src: string;
  alt: string;
  caption: string;
  size: 'full' | 'medium' | 'small';
}

export interface DividerProps {
  style: 'solid' | 'dashed' | 'dots';
}

export interface CodeProps {
  language: string;
  code: string;
}

export interface CalloutProps {
  variant: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  body: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StatsProps {
  items: StatItem[];
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesProps {
  items: FeatureItem[];
}

export type BlockProps =
  | HeadingProps
  | ParagraphProps
  | ImageProps
  | DividerProps
  | CodeProps
  | CalloutProps
  | StatsProps
  | FeaturesProps;

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<BlockType, BlockProps> = {
  heading: { level: 2, text: 'Section Heading' } as HeadingProps,
  paragraph: { html: '<p>Write something here...</p>' } as ParagraphProps,
  image: { src: '', alt: '', caption: '', size: 'full' } as ImageProps,
  divider: { style: 'solid' } as DividerProps,
  code: { language: 'typescript', code: '// Your code here' } as CodeProps,
  callout: { variant: 'info', title: 'Note', body: 'Something worth highlighting.' } as CalloutProps,
  stats: { items: [{ value: '100+', label: 'Users' }, { value: '2 yrs', label: 'In production' }] } as StatsProps,
  features: {
    items: [
      { icon: '⚡', title: 'Fast', description: 'Built for speed from the ground up.' },
      { icon: '🔒', title: 'Secure', description: 'Security-first design.' },
    ],
  } as FeaturesProps,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createBlock(type: BlockType): Block {
  return {
    id: generateId(),
    type,
    props: structuredClone(BLOCK_DEFAULTS[type]),
  };
}

export function parseBlocks(content: string): Block[] | null {
  if (!content || !content.trimStart().startsWith('[')) return null;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as Block[];
    return null;
  } catch {
    return null;
  }
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

export function migrateHtmlToBlocks(html: string): Block[] {
  return [{ id: generateId(), type: 'paragraph', props: { html } as ParagraphProps }];
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback for server-side (Node)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Display labels ───────────────────────────────────────────────────────────

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  image: 'Image',
  divider: 'Divider',
  code: 'Code Block',
  callout: 'Callout',
  stats: 'Stats Grid',
  features: 'Feature List',
};
