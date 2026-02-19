'use client';

import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ListProps } from '../../../lib/blocks';

interface PreviewProps { props: ListProps }
interface InlineEditorProps { props: ListProps; onChange: (props: ListProps) => void }
interface PropertiesProps { props: ListProps; onChange: (props: ListProps) => void }

function getPrefix(style: ListProps['style'], index: number): string {
  switch (style) {
    case 'bullet':   return '•';
    case 'numbered': return `${index + 1}.`;
    case 'dash':     return '–';
    case 'check':    return '☐';
  }
}

export function ListBlockPreview({ props }: PreviewProps) {
  const nonEmpty = props.items.filter(Boolean);
  if (!nonEmpty.length) {
    return <p className="text-muted-foreground/40 italic text-sm py-2">Empty list...</p>;
  }
  return (
    <div className="space-y-1.5 my-1 text-sm">
      {nonEmpty.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="shrink-0 text-muted-foreground w-5 text-center select-none leading-relaxed">
            {getPrefix(props.style, i)}
          </span>
          <span className="leading-relaxed">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function ListInlineEditor({ props, onChange }: InlineEditorProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateItem = (index: number, value: string) => {
    const items = [...props.items];
    items[index] = value;
    onChange({ ...props, items });
  };

  const addItem = (afterIndex?: number) => {
    const items = [...props.items];
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : items.length;
    items.splice(insertAt, 0, '');
    onChange({ ...props, items });
    setTimeout(() => inputRefs.current[insertAt]?.focus(), 20);
  };

  const removeItem = (index: number) => {
    if (props.items.length <= 1) {
      updateItem(0, '');
      return;
    }
    const items = props.items.filter((_, i) => i !== index);
    onChange({ ...props, items });
    setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 20);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(index);
    } else if (e.key === 'Backspace' && props.items[index] === '') {
      e.preventDefault();
      removeItem(index);
    }
  };

  return (
    <div className="py-1 space-y-0.5">
      {props.items.map((item, i) => (
        <div key={i} className="group/item flex items-center gap-2 rounded px-1 hover:bg-muted/30">
          <span className="shrink-0 text-muted-foreground text-sm w-5 text-center select-none">
            {getPrefix(props.style, i)}
          </span>
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="List item..."
            className="flex-1 bg-transparent text-sm outline-none py-1 placeholder:text-muted-foreground/40"
          />
          <button
            onClick={() => removeItem(i)}
            tabIndex={-1}
            className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={() => addItem()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1.5 ml-1 py-1"
      >
        <Plus className="h-3 w-3" />
        Add item
      </button>
    </div>
  );
}

export function ListBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>List style</Label>
        <Select
          value={props.style}
          onValueChange={(v) => onChange({ ...props, style: v as ListProps['style'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bullet">• Bullet</SelectItem>
            <SelectItem value="numbered">1. Numbered</SelectItem>
            <SelectItem value="dash">– Dashed</SelectItem>
            <SelectItem value="check">☐ Checklist</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground italic">
        Click the block in the canvas to edit items.
      </p>
    </div>
  );
}
