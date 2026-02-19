import type { Block, HeadingProps } from './blocks';

export function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface TocItem {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

export function extractTocItems(blocks: Block[]): TocItem[] {
  return blocks
    .filter((b) => b.type === 'heading')
    .map((b) => {
      const props = b.props as HeadingProps;
      return { level: props.level, text: props.text, id: headingId(props.text) };
    })
    .filter((item) => item.text && item.id);
}
