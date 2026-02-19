'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { StatsProps, StatItem } from '../../../lib/blocks';

interface PreviewProps { props: StatsProps }
interface PropertiesProps { props: StatsProps; onChange: (props: StatsProps) => void }

export function StatsBlockPreview({ props }: PreviewProps) {
  if (!props.items.length) {
    return <p className="text-muted-foreground/40 italic text-sm py-2">No stats defined yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-1">
      {props.items.map((item, i) => (
        <div key={i} className="rounded-xl border bg-muted/30 p-4 text-center">
          <div className="text-2xl font-bold text-primary">{item.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function StatsBlockProperties({ props, onChange }: PropertiesProps) {
  const update = (index: number, field: keyof StatItem, value: string) => {
    const items = props.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...props, items });
  };

  const add = () => onChange({ ...props, items: [...props.items, { value: '', label: '' }] });

  const remove = (index: number) =>
    onChange({ ...props, items: props.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      {props.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Value</Label>
            <Input value={item.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="100+" className="h-8" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Label</Label>
            <Input value={item.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Users" className="h-8" />
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add} disabled={props.items.length >= 9}>
        <Plus className="h-3.5 w-3.5" />
        Add stat
      </Button>
    </div>
  );
}
