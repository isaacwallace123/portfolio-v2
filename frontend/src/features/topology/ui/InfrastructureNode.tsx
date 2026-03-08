'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
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

const infraStyles: Record<string, { icon: string; glow: string; border: string; bg: string }> = {
  internet: { icon: 'text-blue-400',   glow: 'shadow-[0_0_16px_hsl(220_80%_65%/0.25)]',  border: 'border-blue-500/30',   bg: 'bg-blue-500/8' },
  router:   { icon: 'text-orange-400', glow: 'shadow-[0_0_16px_hsl(30_90%_60%/0.25)]',   border: 'border-orange-500/30', bg: 'bg-orange-500/8' },
  server:   { icon: 'text-emerald-400',glow: 'shadow-[0_0_16px_hsl(160_70%_55%/0.25)]',  border: 'border-emerald-500/30',bg: 'bg-emerald-500/8' },
  database: { icon: 'text-violet-400', glow: 'shadow-[0_0_16px_hsl(265_75%_65%/0.25)]',  border: 'border-violet-500/30', bg: 'bg-violet-500/8' },
  switch:   { icon: 'text-cyan-400',   glow: 'shadow-[0_0_16px_hsl(195_90%_60%/0.25)]',  border: 'border-cyan-500/30',   bg: 'bg-cyan-500/8' },
  firewall: { icon: 'text-red-400',    glow: 'shadow-[0_0_16px_hsl(0_75%_60%/0.25)]',    border: 'border-red-500/30',    bg: 'bg-red-500/8' },
};

const DEFAULT_STYLE = { icon: 'text-muted-foreground', glow: '', border: 'border-white/10', bg: 'bg-white/5' };

export const InfrastructureNode = memo(({ data }: NodeProps<InfrastructureNodeData>) => {
  const { label, infrastructureType, selected } = data;
  const Icon = infraIcons[infrastructureType] || Server;
  const s = infraStyles[infrastructureType] ?? DEFAULT_STYLE;

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0! w-2! h-2!" />

      <div
        className={`min-w-25 max-w-40 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${s.border} ${s.bg} ${s.glow} ${
          selected ? 'ring-2 ring-violet-500/30' : ''
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Icon className={`h-5 w-5 ${s.icon}`} />
          <p className="text-xs font-medium text-center text-foreground/80">{label}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0! w-2! h-2!" />
    </>
  );
});

InfrastructureNode.displayName = 'InfrastructureNode';
