'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { FeaturesProps, FeatureItem } from '../../../lib/blocks';

interface PreviewProps { props: FeaturesProps }
interface PropertiesProps { props: FeaturesProps; onChange: (props: FeaturesProps) => void }

export function FeaturesBlockPreview({ props }: PreviewProps) {
  if (!props.items.length) {
    return <p className="text-muted-foreground/40 italic text-sm py-2">No features defined yet.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 my-1">
      {props.items.map((item, i) => (
        <div key={i} className="flex gap-3 rounded-xl border bg-muted/20 p-4">
          <span className="text-2xl shrink-0">{item.icon || '✦'}</span>
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm">{item.title || 'Feature'}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturesBlockProperties({ props, onChange }: PropertiesProps) {
  const update = (index: number, field: keyof FeatureItem, value: string) => {
    const items = props.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...props, items });
  };

  const add = () =>
    onChange({ ...props, items: [...props.items, { icon: '✦', title: '', description: '' }] });

  const remove = (index: number) =>
    onChange({ ...props, items: props.items.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4">
      {props.items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <div className="grid grid-cols-[56px_1fr] gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <Input value={item.icon} onChange={(e) => update(i, 'icon', e.target.value)} className="h-8 text-center text-lg" maxLength={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={item.title} onChange={(e) => update(i, 'title', e.target.value)} placeholder="Feature name" className="h-8" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input value={item.description} onChange={(e) => update(i, 'description', e.target.value)} placeholder="Short description..." className="h-8" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add} disabled={props.items.length >= 8}>
        <Plus className="h-3.5 w-3.5" />
        Add feature
      </Button>
    </div>
  );
}
