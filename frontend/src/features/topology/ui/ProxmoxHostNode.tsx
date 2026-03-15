'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeInfo } from '@/features/topology/lib/types';

export interface ProxmoxHostNodeData {
  label?: string;
  k8sNodes?: NodeInfo[];
  selectedNodeName?: string;
  onNodeClick?: (node: NodeInfo) => void;
  nodeUtilization?: Record<string, { cpu: number | null; memory: number | null }>;
}

function cpuColor(pct: number): string {
  if (pct >= 80) return 'bg-red-500';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-emerald-400';
}

export const ProxmoxHostNode = memo(({ data }: NodeProps<ProxmoxHostNodeData>) => {
  const nodes = data.k8sNodes ?? [];
  const { onNodeClick, selectedNodeName, nodeUtilization } = data;

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
          {data.label ? `Proxmox — ${data.label}` : 'Proxmox VE Host'}
        </p>
        <div className="flex gap-3 flex-wrap">
          {displayNodes.map((node) => {
            const isSelected = selectedNodeName === node.name;
            const util = nodeUtilization?.[node.name];
            const cpu = util?.cpu ?? null;
            const mem = util?.memory ?? null;

            return (
              <button
                key={node.name}
                onClick={() => onNodeClick?.(node)}
                className={`flex-1 min-w-30 rounded-xl border text-left px-3 py-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-amber-400/60 bg-amber-500/20 shadow-[0_0_12px_hsl(38_90%_60%/0.2)]'
                    : 'border-amber-500/20 bg-amber-500/8 hover:border-amber-400/40 hover:bg-amber-500/15'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.status === 'Ready' ? 'bg-emerald-400 shadow-[0_0_6px_hsl(160_70%_55%/0.8)]' : 'bg-yellow-400'}`} />
                  <p className="text-xs font-semibold text-foreground/90 truncate">{node.name}</p>
                </div>
                <p className="text-[10px] text-amber-400/60 capitalize">{node.role}</p>
                {node.cpuCores > 0 && (
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5">{node.cpuCores} CPU · {node.memoryGB.toFixed(0)} GB</p>
                )}

                {/* CPU / Memory bars */}
                {(cpu !== null || mem !== null) && (
                  <div className="mt-2 space-y-1">
                    {cpu !== null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground/50 w-5 shrink-0">CPU</span>
                        <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cpuColor(cpu)}`}
                            style={{ width: `${Math.min(cpu, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums text-muted-foreground/60 w-7 text-right">{cpu.toFixed(0)}%</span>
                      </div>
                    )}
                    {mem !== null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground/50 w-5 shrink-0">Mem</span>
                        <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cpuColor(mem)}`}
                            style={{ width: `${Math.min(mem, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums text-muted-foreground/60 w-7 text-right">{mem.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
    </>
  );
});

ProxmoxHostNode.displayName = 'ProxmoxHostNode';
