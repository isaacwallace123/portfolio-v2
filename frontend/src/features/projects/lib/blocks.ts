import { randomUUID } from 'crypto';
import { serializeToMdx } from './mdxSerializer';
import { parseMdxToBlocks } from './mdxParser';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'image'
  | 'divider'
  | 'code'
  | 'callout'
  | 'stats'
  | 'features'
  | 'table';

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

export interface ListProps {
  style: 'bullet' | 'numbered' | 'dash' | 'check';
  items: string[];
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

export interface TableProps {
  headers: string[];
  rows: string[][];
}

export type BlockProps =
  | HeadingProps
  | ParagraphProps
  | ListProps
  | ImageProps
  | DividerProps
  | CodeProps
  | CalloutProps
  | StatsProps
  | FeaturesProps
  | TableProps;

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const BLOCK_DEFAULTS: Record<BlockType, BlockProps> = {
  heading: { level: 2, text: 'Section Heading' } as HeadingProps,
  paragraph: { html: '<p>Write something here...</p>' } as ParagraphProps,
  list: { style: 'bullet', items: [''] } as ListProps,
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
  table: { headers: ['Column 1', 'Column 2', 'Column 3'], rows: [['', '', '']] } as TableProps,
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
  if (!content) return null;
  const trimmed = content.trimStart();

  // Legacy JSON format — parse and return as-is (will be re-saved as MDX on next save)
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed as Block[];
    } catch {
      // fall through to MDX
    }
  }

  // Legacy raw HTML (not MDX, not JSON) — wrap in a paragraph block
  if (trimmed.startsWith('<') && !trimmed.startsWith('<Callout') && !trimmed.startsWith('<StatsGrid') && !trimmed.startsWith('<FeatureList') && !trimmed.startsWith('<figure') && !trimmed.startsWith('<hr')) {
    return [{ id: generateId(), type: 'paragraph', props: { html: content } as ParagraphProps }];
  }

  // MDX format
  return parseMdxToBlocks(content);
}

export function serializeBlocks(blocks: Block[]): string {
  return serializeToMdx(blocks);
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
  list: 'List',
  image: 'Image',
  divider: 'Divider',
  code: 'Code Block',
  callout: 'Callout',
  stats: 'Stats Grid',
  features: 'Feature List',
  table: 'Table',
};
