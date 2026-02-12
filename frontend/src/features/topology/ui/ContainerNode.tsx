'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export interface ContainerNodeData {
  containerName: string;
  containerId: string;
  icon: string | null;
  state?: string;
  health?: string;
  selected?: boolean;
  editable?: boolean;
}

const stateColors: Record<string, string> = {
  running: 'bg-green-500',
  exited: 'bg-red-500',
  restarting: 'bg-yellow-500',
  paused: 'bg-blue-500',
  created: 'bg-gray-500',
  dead: 'bg-red-700',
};

export const ContainerNode = memo(({ data }: NodeProps<ContainerNodeData>) => {
  const { containerName, icon, state, selected } = data;
  const dotColor = stateColors[state || ''] || 'bg-gray-400';

  const displayName = containerName.replace(/^portfolio_/, '');

  const initials = displayName
    .split(/[-_]/)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />

      <Card
        className={`min-w-25 max-w-40 px-3 py-3 shadow-md border transition-all cursor-pointer ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {icon ? (
              <Image src={icon} alt="" width={28} height={28} className="rounded-sm" unoptimized />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
            )}
          </div>

          <p className="text-xs font-medium text-center truncate max-w-full">{displayName}</p>

          {state && (
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span className="text-[10px] text-muted-foreground capitalize">{state}</span>
            </div>
          )}
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </>
  );
});

ContainerNode.displayName = 'ContainerNode';
