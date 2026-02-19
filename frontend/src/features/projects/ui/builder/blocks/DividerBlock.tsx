'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DividerProps } from '../../../lib/blocks';

interface PreviewProps { props: DividerProps }
interface PropertiesProps { props: DividerProps; onChange: (props: DividerProps) => void }

export function DividerBlockPreview({ props }: PreviewProps) {
  const style =
    props.style === 'dashed' ? 'border-dashed' :
    props.style === 'dots' ? 'border-dotted' :
    'border-solid';
  return <hr className={`my-4 border-t-2 ${style} border-border`} />;
}

export function DividerBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-1.5">
      <Label>Style</Label>
      <Select
        value={props.style}
        onValueChange={(v) => onChange({ ...props, style: v as DividerProps['style'] })}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="solid">Solid</SelectItem>
          <SelectItem value="dashed">Dashed</SelectItem>
          <SelectItem value="dots">Dotted</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
