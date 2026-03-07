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
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {icon ? (
                <Image src={icon} alt="" width={20} height={20} unoptimized />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight">{appName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{namespace}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1 items-center flex-wrap">
              {pods.slice(0, 8).map((pod, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    pod.state === 'running'
                      ? 'bg-green-500'
                      : pod.state === 'pending'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
              ))}
              {total > 8 && (
                <span className="text-[9px] text-muted-foreground">+{total - 8}</span>
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${
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
