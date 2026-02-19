'use client';

import type { Block } from '../lib/blocks';
import { HeadingBlockPreview } from './builder/blocks/HeadingBlock';
import { ParagraphBlockPreview } from './builder/blocks/ParagraphBlock';
import { ImageBlockPreview } from './builder/blocks/ImageBlock';
import { DividerBlockPreview } from './builder/blocks/DividerBlock';
import { CodeBlockPreview } from './builder/blocks/CodeBlock';
import { CalloutBlockPreview } from './builder/blocks/CalloutBlock';
import { StatsBlockPreview } from './builder/blocks/StatsBlock';
import { FeaturesBlockPreview } from './builder/blocks/FeaturesBlock';
import type {
  HeadingProps,
  ParagraphProps,
  ImageProps,
  DividerProps,
  CodeProps,
  CalloutProps,
  StatsProps,
  FeaturesProps,
} from '../lib/blocks';

interface BlockRendererProps {
  blocks: Block[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === 'heading' && <HeadingBlockPreview props={block.props as HeadingProps} />}
          {block.type === 'paragraph' && <ParagraphBlockPreview props={block.props as ParagraphProps} />}
          {block.type === 'image' && <ImageBlockPreview props={block.props as ImageProps} />}
          {block.type === 'divider' && <DividerBlockPreview props={block.props as DividerProps} />}
          {block.type === 'code' && <CodeBlockPreview props={block.props as CodeProps} />}
          {block.type === 'callout' && <CalloutBlockPreview props={block.props as CalloutProps} />}
          {block.type === 'stats' && <StatsBlockPreview props={block.props as StatsProps} />}
          {block.type === 'features' && <FeaturesBlockPreview props={block.props as FeaturesProps} />}
        </div>
      ))}
    </div>
  );
}
