'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface NamespaceGroupNodeData {
  namespace: string;
  podCount: number;
}

const NS_STYLES: Record<string, { border: string; bg: string; label: string; dot: string }> = {
  portfolio:  { border: 'border-violet-500/25',  bg: 'bg-violet-500/5',  label: 'text-violet-400',  dot: 'bg-violet-500' },
  networking: { border: 'border-cyan-500/25',    bg: 'bg-cyan-500/5',    label: 'text-cyan-400',    dot: 'bg-cyan-500' },
  monitoring: { border: 'border-emerald-500/25', bg: 'bg-emerald-500/5', label: 'text-emerald-400', dot: 'bg-emerald-500' },
  media:      { border: 'border-rose-500/25',    bg: 'bg-rose-500/5',    label: 'text-rose-400',    dot: 'bg-rose-500' },
  argocd:     { border: 'border-orange-500/25',  bg: 'bg-orange-500/5',  label: 'text-orange-400',  dot: 'bg-orange-500' },
  secrets:    { border: 'border-red-500/25',     bg: 'bg-red-500/5',     label: 'text-red-400',     dot: 'bg-red-500' },
};

const DEFAULT_STYLE = { border: 'border-white/10', bg: 'bg-white/3', label: 'text-muted-foreground', dot: 'bg-muted-foreground' };

export const NamespaceGroupNode = memo(({ data }: NodeProps<NamespaceGroupNodeData>) => {
  const { namespace, podCount } = data;
  const s = NS_STYLES[namespace] ?? DEFAULT_STYLE;

  return (
    <div className={`w-full h-full rounded-2xl border backdrop-blur-sm pointer-events-none ${s.border} ${s.bg}`}>
      <Handle type="target" id="target-top"    position={Position.Top}    className="opacity-0! w-2! h-2!" />
      <Handle type="target" id="target-bottom" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
      <Handle type="target" id="target-left"   position={Position.Left}   className="opacity-0! w-2! h-2!" />
      <Handle type="target" id="target-right"  position={Position.Right}  className="opacity-0! w-2! h-2!" />
      <Handle type="source" id="source-top"    position={Position.Top}    className="opacity-0! w-2! h-2!" />
      <Handle type="source" id="source-bottom" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
      <Handle type="source" id="source-left"   position={Position.Left}   className="opacity-0! w-2! h-2!" />
      <Handle type="source" id="source-right"  position={Position.Right}  className="opacity-0! w-2! h-2!" />
      <div className="px-4 pt-3 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${s.label}`}>
          {namespace}
        </span>
        <span className="text-[10px] text-muted-foreground/40">{podCount} pod{podCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
});

NamespaceGroupNode.displayName = 'NamespaceGroupNode';
