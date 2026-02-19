'use client';

import { RichTextEditor } from '../../RichTextEditor';
import type { ParagraphProps } from '../../../lib/blocks';

interface PreviewProps { props: ParagraphProps }
interface PropertiesProps { props: ParagraphProps; onChange: (props: ParagraphProps) => void }

export function ParagraphBlockPreview({ props }: PreviewProps) {
  if (!props.html || props.html === '<p></p>') {
    return <p className="text-muted-foreground/40 italic py-1">Paragraph text...</p>;
  }
  return (
    <div
      className="project-content prose-sm max-w-none py-1"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}

export function ParagraphBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-1.5">
      <RichTextEditor
        content={props.html}
        onChange={(html) => onChange({ ...props, html })}
        placeholder="Write your paragraph here..."
      />
    </div>
  );
}
