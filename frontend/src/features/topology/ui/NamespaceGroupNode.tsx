'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface NamespaceGroupNodeData {
  namespace: string;
  podCount: number;
}

export const NamespaceGroupNode = memo(({ data }: NodeProps<NamespaceGroupNodeData>) => {
  const { namespace, podCount } = data;

  return (
    <div className="w-full h-full rounded-xl border border-border/25 bg-muted/8 pointer-events-none">
      <Handle type="target" id="target-top"    position={Position.Top}    className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="target" id="target-bottom" position={Position.Bottom} className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="target" id="target-left"   position={Position.Left}   className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="target" id="target-right"  position={Position.Right}  className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="source" id="source-top"    position={Position.Top}    className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="source" id="source-bottom" position={Position.Bottom} className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="source" id="source-left"   position={Position.Left}   className="bg-border! w-2! h-2! border-border! opacity-0" />
      <Handle type="source" id="source-right"  position={Position.Right}  className="bg-border! w-2! h-2! border-border! opacity-0" />
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
