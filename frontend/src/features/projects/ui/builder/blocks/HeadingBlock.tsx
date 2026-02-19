'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HeadingProps } from '../../../lib/blocks';
import { headingId } from '../../../lib/toc';
export { headingId } from '../../../lib/toc';

interface PreviewProps { props: HeadingProps }
interface PropertiesProps { props: HeadingProps; onChange: (props: HeadingProps) => void }

const TAG_CLASS: Record<number, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-bold',
  3: 'text-xl font-semibold',
};

export function HeadingBlockPreview({ props }: PreviewProps) {
  const Tag = `h${props.level}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag id={props.text ? headingId(props.text) : undefined} className={TAG_CLASS[props.level] + ' pb-1 scroll-mt-20'}>
      {props.text || <span className="text-muted-foreground/40 italic">Heading text...</span>}
    </Tag>
  );
}

export function HeadingBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Level</Label>
        <Select
          value={String(props.level)}
          onValueChange={(v) => onChange({ ...props, level: Number(v) as 1 | 2 | 3 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1 — Large</SelectItem>
            <SelectItem value="2">H2 — Medium</SelectItem>
            <SelectItem value="3">H3 — Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Text</Label>
        <Input
          value={props.text}
          onChange={(e) => onChange({ ...props, text: e.target.value })}
          placeholder="Section heading..."
        />
      </div>
    </div>
  );
}
