'use client';

import type { ComponentType } from 'react';
import { Heading2, AlignLeft, ImageIcon, Minus, Code2, AlertCircle, BarChart3, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BlockType } from '../../lib/blocks';

interface Section {
  label: string;
  blocks: { type: BlockType; label: string; icon: ComponentType<{ className?: string }>; description: string }[];
}

const SECTIONS: Section[] = [
  {
    label: 'Basic',
    blocks: [
      { type: 'heading',   label: 'Heading',    icon: Heading2,   description: 'H1, H2, or H3 section title' },
      { type: 'paragraph', label: 'Paragraph',  icon: AlignLeft,  description: 'Rich text with formatting' },
      { type: 'divider',   label: 'Divider',    icon: Minus,      description: 'Horizontal separator line' },
    ],
  },
  {
    label: 'Media',
    blocks: [
      { type: 'image', label: 'Image', icon: ImageIcon, description: 'Image with optional caption' },
    ],
  },
  {
    label: 'Code & Notes',
    blocks: [
      { type: 'code',    label: 'Code Block', icon: Code2,       description: 'Syntax-highlighted code' },
      { type: 'callout', label: 'Callout',    icon: AlertCircle, description: 'Info, warning, success, danger' },
    ],
  },
  {
    label: 'Data',
    blocks: [
      { type: 'stats',    label: 'Stats Grid',    icon: BarChart3, description: 'Key metrics and numbers' },
      { type: 'features', label: 'Feature List',  icon: Layers,    description: 'Icon + title + description cards' },
    ],
  },
];

interface ComponentPickerProps {
  onAdd: (type: BlockType) => void;
}

export function ComponentPicker({ onAdd }: ComponentPickerProps) {
  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Components</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 px-1">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.blocks.map(({ type, label, icon: Icon, description }) => (
                <Button
                  key={type}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-2.5 px-3 text-left hover:bg-primary/5 group"
                  onClick={() => onAdd(type)}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted group-hover:bg-primary/10 shrink-0 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
