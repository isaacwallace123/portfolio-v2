'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import type { ContainerInfo } from '@/features/topology/lib/types';

export interface AppGroupNodeData {
  appName: string;
  namespace: string;
  pods: ContainerInfo[];
  icon: string | null;
  selected?: boolean;
}

export const AppGroupNode = memo(({ data, selected }: NodeProps<AppGroupNodeData>) => {
  const { appName, namespace, pods, icon } = data;

  const running = pods.filter((p) => p.state === 'running').length;
  const total = pods.length;
  const allRunning = running === total;
  const anyRunning = running > 0;

  const initials = appName
    .split(/[-_]/)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2 !border-border" />

      <Card
        className={`w-[155px] shadow-sm cursor-pointer transition-all ${
          selected
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border/50 hover:border-primary/40 hover:shadow-md'
        }`}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {icon ? (
                <Image src={icon} alt="" width={16} height={16} unoptimized />
              ) : (
                <span className="text-[9px] font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight">{appName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{namespace}</p>
            </div>
            <span
              className={`text-[9px] font-semibold shrink-0 ${
                allRunning ? 'text-green-600' : anyRunning ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {running}/{total}
            </span>
          </div>
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2 !border-border" />
    </>
  );
});

AppGroupNode.displayName = 'AppGroupNode';
