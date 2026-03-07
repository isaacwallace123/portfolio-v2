'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { ContainerInfo } from '../lib/types';

export interface PodNodeData {
  pod: ContainerInfo;
}

export const PodNode = memo(({ data, selected }: NodeProps<PodNodeData>) => {
  const { pod } = data;
  const displayName = pod.name.length > 22 ? pod.name.slice(0, 20) + '…' : pod.name;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border !w-1.5 !h-1.5 !border-border" />
      <div
        className={`w-[135px] rounded-md border bg-background/95 px-2.5 py-1.5 shadow-sm cursor-pointer transition-all ${
          selected
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-border/40 hover:border-primary/30'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              pod.state === 'running'
                ? 'bg-green-500'
                : pod.state === 'pending'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-[10px] font-medium truncate">{displayName}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-1.5 !h-1.5 !border-border" />
    </>
  );
});

PodNode.displayName = 'PodNode';
