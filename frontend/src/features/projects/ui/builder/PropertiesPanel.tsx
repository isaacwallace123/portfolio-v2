'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import type { Block, BlockProps, HeadingProps, ListProps, ImageProps, DividerProps, CodeProps, CalloutProps, StatsProps, FeaturesProps } from '../../lib/blocks';
import { BLOCK_LABELS } from '../../lib/blocks';
import { HeadingBlockProperties } from './blocks/HeadingBlock';
import { ListBlockProperties } from './blocks/ListBlock';
import { ImageBlockProperties } from './blocks/ImageBlock';
import { DividerBlockProperties } from './blocks/DividerBlock';
import { CodeBlockProperties } from './blocks/CodeBlock';
import { CalloutBlockProperties } from './blocks/CalloutBlock';
import { StatsBlockProperties } from './blocks/StatsBlock';
import { FeaturesBlockProperties } from './blocks/FeaturesBlock';

interface PageSettings {
  title: string;
  slug: string;
  isStartPage: boolean;
  hasOtherStartPage: boolean;
}

interface PropertiesPanelProps {
  selectedBlock: Block | null;
  pageSettings: PageSettings;
  onBlockChange: (id: string, props: BlockProps) => void;
  onPageSettingsChange: (settings: Partial<PageSettings>) => void;
}

export function PropertiesPanel({
  selectedBlock,
  pageSettings,
  onBlockChange,
  onPageSettingsChange,
}: PropertiesPanelProps) {
  return (
    <div className="flex flex-col h-full border-l bg-background/50">
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {selectedBlock ? BLOCK_LABELS[selectedBlock.type] : 'Page Settings'}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedBlock ? (
          selectedBlock.type === 'paragraph' ? (
            <p className="text-sm text-muted-foreground italic">
              Click the block in the canvas to edit.
            </p>
          ) : (
            <BlockProperties key={selectedBlock.id} block={selectedBlock} onChange={(props) => onBlockChange(selectedBlock.id, props)} />
          )
        ) : (
          <PageSettingsForm settings={pageSettings} onChange={onPageSettingsChange} />
        )}
      </div>
    </div>
  );
}

function BlockProperties({ block, onChange }: { block: Block; onChange: (props: BlockProps) => void }) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlockProperties props={block.props as HeadingProps} onChange={onChange as (p: HeadingProps) => void} />;
    case 'list':
      return <ListBlockProperties props={block.props as ListProps} onChange={onChange as (p: ListProps) => void} />;
    case 'image':
      return <ImageBlockProperties props={block.props as ImageProps} onChange={onChange as (p: ImageProps) => void} />;
    case 'divider':
      return <DividerBlockProperties props={block.props as DividerProps} onChange={onChange as (p: DividerProps) => void} />;
    case 'code':
      return <CodeBlockProperties props={block.props as CodeProps} onChange={onChange as (p: CodeProps) => void} />;
    case 'callout':
      return <CalloutBlockProperties props={block.props as CalloutProps} onChange={onChange as (p: CalloutProps) => void} />;
    case 'stats':
      return <StatsBlockProperties props={block.props as StatsProps} onChange={onChange as (p: StatsProps) => void} />;
    case 'features':
      return <FeaturesBlockProperties props={block.props as FeaturesProps} onChange={onChange as (p: FeaturesProps) => void} />;
    default:
      return null;
  }
}

function PageSettingsForm({ settings, onChange }: { settings: PageSettings; onChange: (s: Partial<PageSettings>) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Page title</Label>
        <Input
          value={settings.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Page title..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL slug</Label>
        <Input
          value={settings.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="page-slug"
        />
      </div>

      {settings.isStartPage ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">Start page</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Start page</p>
            <p className="text-xs text-muted-foreground">Default entry point</p>
          </div>
          <Switch
            checked={settings.isStartPage}
            onCheckedChange={(checked) => onChange({ isStartPage: checked })}
            disabled={settings.hasOtherStartPage}
          />
        </div>
      )}
    </div>
  );
}
