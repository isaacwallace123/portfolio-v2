'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeInfo } from '@/features/topology/lib/types';

export interface ProxmoxHostNodeData {
  label?: string;
  k8sNodes?: NodeInfo[];
}

export const ProxmoxHostNode = memo(({ data }: NodeProps<ProxmoxHostNodeData>) => {
  const nodes = data.k8sNodes ?? [];

  const displayNodes = nodes.length > 0
    ? nodes
    : [
        { name: 'k8s-control', role: 'control-plane', status: 'Unknown', cpuCores: 0, memoryGB: 0, osImage: '' },
        { name: 'k8s-worker', role: 'worker', status: 'Unknown', cpuCores: 0, memoryGB: 0, osImage: '' },
      ];

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0! w-2! h-2!" />
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/6 backdrop-blur-sm px-4 pt-2.5 pb-3 shadow-[0_0_24px_hsl(38_90%_60%/0.12)] min-w-80">
        <p className="text-[10px] font-bold tracking-widest text-amber-400/80 uppercase mb-2.5">
          Proxmox VE Host
        </p>
        <div className="flex gap-3 flex-wrap">
          {displayNodes.map((node) => (
            <div key={node.name} className="flex-1 min-w-30 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.status === 'Ready' ? 'bg-emerald-400 shadow-[0_0_6px_hsl(160_70%_55%/0.8)]' : 'bg-yellow-400'}`} />
                <p className="text-xs font-semibold text-foreground/90 truncate">{node.name}</p>
              </div>
              <p className="text-[10px] text-amber-400/60 capitalize">{node.role}</p>
              {node.cpuCores > 0 && (
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{node.cpuCores} CPU · {node.memoryGB.toFixed(0)} GB</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
    </>
  );
});

ProxmoxHostNode.displayName = 'ProxmoxHostNode';
