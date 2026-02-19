'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Block, BlockProps, HeadingProps, ParagraphProps, ImageProps, DividerProps, CodeProps, CalloutProps, StatsProps, FeaturesProps } from '../../lib/blocks';
import { HeadingBlockPreview } from './blocks/HeadingBlock';
import { ParagraphBlockPreview, ParagraphInlineEditor } from './blocks/ParagraphBlock';
import { ImageBlockPreview } from './blocks/ImageBlock';
import { DividerBlockPreview } from './blocks/DividerBlock';
import { CodeBlockPreview } from './blocks/CodeBlock';
import { CalloutBlockPreview } from './blocks/CalloutBlock';
import { StatsBlockPreview } from './blocks/StatsBlock';
import { FeaturesBlockPreview } from './blocks/FeaturesBlock';

interface SortableBlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBlockChange: (id: string, props: BlockProps) => void;
}

export function SortableBlockItem({ block, isSelected, onSelect, onDelete, onDuplicate, onBlockChange }: SortableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const isInlineEditing = block.type === 'paragraph' && isSelected;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border bg-background transition-all cursor-pointer',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
        isDragging && 'z-50'
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Drag handle — hidden while inline editing to avoid conflicts */}
      {!isInlineEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Block content */}
      <div className={cn('py-3', isInlineEditing ? 'px-4' : 'px-10')}>
        {isInlineEditing ? (
          <ParagraphInlineEditor
            key={block.id}
            props={block.props as ParagraphProps}
            onChange={(newProps) => onBlockChange(block.id, newProps)}
          />
        ) : (
          <BlockPreviewSwitch block={block} />
        )}
      </div>

      {/* Action buttons */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDuplicate}
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function BlockPreviewSwitch({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':   return <HeadingBlockPreview   props={block.props as HeadingProps} />;
    case 'paragraph': return <ParagraphBlockPreview props={block.props as ParagraphProps} />;
    case 'image':     return <ImageBlockPreview     props={block.props as ImageProps} />;
    case 'divider':   return <DividerBlockPreview   props={block.props as DividerProps} />;
    case 'code':      return <CodeBlockPreview      props={block.props as CodeProps} />;
    case 'callout':   return <CalloutBlockPreview   props={block.props as CalloutProps} />;
    case 'stats':     return <StatsBlockPreview     props={block.props as StatsProps} />;
    case 'features':  return <FeaturesBlockPreview  props={block.props as FeaturesProps} />;
    default:          return null;
  }
}
