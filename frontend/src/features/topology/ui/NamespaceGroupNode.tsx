'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';

export interface NamespaceGroupNodeData {
  namespace: string;
  podCount: number;
}

export const NamespaceGroupNode = memo(({ data }: NodeProps<NamespaceGroupNodeData>) => {
  const { namespace, podCount } = data;

  return (
    <div className="w-full h-full rounded-xl border border-border/25 bg-muted/8 pointer-events-none">
      <div className="px-4 pt-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
          {namespace}
        </span>
        <span className="text-[10px] text-muted-foreground/40">{podCount} pod{podCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
});

NamespaceGroupNode.displayName = 'NamespaceGroupNode';
