'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { CalloutProps } from '../../../lib/blocks';

interface PreviewProps { props: CalloutProps }
interface PropertiesProps { props: CalloutProps; onChange: (props: CalloutProps) => void }

const VARIANT_CONFIG = {
  info:    { icon: Info,          bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-600 dark:text-blue-400' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400' },
  success: { icon: CheckCircle,   bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-600 dark:text-green-400' },
  danger:  { icon: XCircle,       bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-600 dark:text-red-400' },
};

export function CalloutBlockPreview({ props }: PreviewProps) {
  const cfg = VARIANT_CONFIG[props.variant];
  const Icon = cfg.icon;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 my-1 ${cfg.bg} ${cfg.border}`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.text}`} />
      <div className="space-y-1 min-w-0">
        {props.title && <p className={`font-semibold text-sm ${cfg.text}`}>{props.title}</p>}
        {props.body && <p className="text-sm text-foreground/80">{props.body}</p>}
        {!props.title && !props.body && <p className="text-sm text-muted-foreground/40 italic">Callout text...</p>}
      </div>
    </div>
  );
}

export function CalloutBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={props.variant}
          onValueChange={(v) => onChange({ ...props, variant: v as CalloutProps['variant'] })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="danger">Danger</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Title (optional)</Label>
        <Input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          placeholder="Callout title..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Body</Label>
        <textarea
          value={props.body}
          onChange={(e) => onChange({ ...props, body: e.target.value })}
          className="w-full h-24 rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Callout message..."
        />
      </div>
    </div>
  );
}
