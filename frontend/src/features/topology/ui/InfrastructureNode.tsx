'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Globe2, Router, Server, Database, Network, Shield } from 'lucide-react';

export interface InfrastructureNodeData {
  label: string;
  infrastructureType: string;
  selected?: boolean;
  editable?: boolean;
}

const infraIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  internet: Globe2,
  router: Router,
  server: Server,
  database: Database,
  switch: Network,
  firewall: Shield,
};

const infraColors: Record<string, string> = {
  internet: 'text-blue-500',
  router: 'text-orange-500',
  server: 'text-green-500',
  database: 'text-purple-500',
  switch: 'text-cyan-500',
  firewall: 'text-red-500',
};

export const InfrastructureNode = memo(({ data }: NodeProps<InfrastructureNodeData>) => {
  const { label, infrastructureType, selected } = data;
  const Icon = infraIcons[infrastructureType] || Server;
  const color = infraColors[infrastructureType] || 'text-muted-foreground';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />

      <Card
        className={`min-w-25 max-w-40 px-3 py-3 shadow-md border transition-all cursor-pointer ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Icon className={`h-6 w-6 ${color}`} />
          <p className="text-xs font-medium text-center">{label}</p>
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </>
  );
});

InfrastructureNode.displayName = 'InfrastructureNode';
