'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface ProxmoxHostNodeData {
  label?: string;
}

export const ProxmoxHostNode = memo(({ data }: NodeProps<ProxmoxHostNodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-2 !h-2 !border-amber-400" />
      <div className="rounded-xl border-2 border-amber-500/60 bg-amber-950/20 px-4 pt-2.5 pb-3 shadow-md min-w-[320px]">
        <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-2.5">
          Proxmox VE Host
        </p>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
            <p className="text-xs font-semibold text-foreground">k8s-control</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Control Plane</p>
          </div>
          <div className="flex-1 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2">
            <p className="text-xs font-semibold text-foreground">k8s-worker</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Worker Node</p>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-2 !h-2 !border-amber-400" />
    </>
  );
});

ProxmoxHostNode.displayName = 'ProxmoxHostNode';
