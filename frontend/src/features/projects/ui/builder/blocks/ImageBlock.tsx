'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadField } from '@/features/uploads/ui/ImageUploadField';
import type { ImageProps } from '../../../lib/blocks';

interface PreviewProps { props: ImageProps }
interface PropertiesProps { props: ImageProps; onChange: (props: ImageProps) => void }

const SIZE_CLASS = { full: 'w-full', medium: 'max-w-lg mx-auto', small: 'max-w-xs mx-auto' };

export function ImageBlockPreview({ props }: PreviewProps) {
  if (!props.src) {
    return (
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 text-muted-foreground text-sm py-12">
        No image selected
      </div>
    );
  }
  return (
    <figure className={SIZE_CLASS[props.size] + ' py-1'}>
      <img
        src={props.src}
        alt={props.alt || ''}
        className="w-full rounded-xl border object-cover"
      />
      {props.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">{props.caption}</figcaption>
      )}
    </figure>
  );
}

export function ImageBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <ImageUploadField
        label="Image"
        value={props.src}
        onChange={(src) => onChange({ ...props, src })}
        aspect="video"
      />
      <div className="space-y-1.5">
        <Label>Alt text</Label>
        <Input
          value={props.alt}
          onChange={(e) => onChange({ ...props, alt: e.target.value })}
          placeholder="Describe the image..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Caption (optional)</Label>
        <Input
          value={props.caption}
          onChange={(e) => onChange({ ...props, caption: e.target.value })}
          placeholder="Image caption..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Size</Label>
        <Select
          value={props.size}
          onValueChange={(v) => onChange({ ...props, size: v as ImageProps['size'] })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full width</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="small">Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
