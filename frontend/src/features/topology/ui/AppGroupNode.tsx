'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import Image from 'next/image';
import type { ContainerInfo } from '@/features/topology/lib/types';

export interface AppGroupNodeData {
  appName: string;
  namespace: string;
  pods: ContainerInfo[];
  icon: string | null;
  selected?: boolean;
  anomalyLevel?: 'low' | 'medium' | 'high' | null;
}

export const AppGroupNode = memo(({ data, selected }: NodeProps<AppGroupNodeData>) => {
  const { appName, namespace, pods, icon, anomalyLevel } = data;

  const activePods = pods.filter((p) => p.state !== 'succeeded' && p.state !== 'completed');
  const running = activePods.filter((p) => p.state === 'running').length;
  const total = activePods.length;
  const allRunning = running === total;
  const anyRunning = running > 0;

  const initials = appName
    .split(/[-_]/)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

  const statusColor = allRunning
    ? 'bg-emerald-400 shadow-[0_0_6px_hsl(160_70%_55%/0.8)]'
    : anyRunning
    ? 'bg-yellow-400 shadow-[0_0_6px_hsl(45_90%_55%/0.8)]'
    : 'bg-red-500';

  return (
    <>
      <Handle id="target-top" type="target" position={Position.Top} className="opacity-0! w-2! h-2!" />
      <Handle id="target-bottom" type="target" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
      <Handle id="source-top" type="source" position={Position.Top} className="opacity-0! w-2! h-2!" />

      <div
        className={`w-[155px] rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-200 ${
          selected
            ? 'border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_hsl(265_75%_65%/0.2)]'
            : anomalyLevel === 'high'
            ? 'border-red-400/50 bg-background/60 shadow-[0_0_14px_rgba(248,113,113,0.35)]'
            : anomalyLevel === 'medium'
            ? 'border-amber-400/50 bg-background/60 shadow-[0_0_14px_rgba(251,191,36,0.35)]'
            : anomalyLevel === 'low'
            ? 'border-sky-400/40 bg-background/60 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
            : 'border-white/10 bg-background/60 hover:border-white/20 hover:bg-background/80 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        }`}
      >
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {icon ? (
              <Image src={icon} alt="" width={16} height={16} unoptimized />
            ) : (
              <span className="text-[9px] font-bold text-muted-foreground">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight text-foreground/90">{appName}</p>
            <p className="text-[10px] text-muted-foreground/60 truncate">{namespace}</p>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
        </div>
      </div>

      <Handle id="source-bottom" type="source" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
    </>
  );
});

AppGroupNode.displayName = 'AppGroupNode';
