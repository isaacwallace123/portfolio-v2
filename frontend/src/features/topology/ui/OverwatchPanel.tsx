'use client';

import type { ComponentType } from 'react';
import { X, BrainCircuit, AlertTriangle, CheckCircle, AlertCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OverwatchInsight, OverwatchAnomaly } from '@/features/topology/lib/types';

interface OverwatchPanelProps {
  insight: OverwatchInsight | null;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const config = (
    {
      healthy: { label: 'Healthy', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Icon: CheckCircle },
      warning: { label: 'Warning', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Icon: AlertTriangle },
      critical: { label: 'Critical', cls: 'bg-red-500/15 text-red-400 border-red-500/30', Icon: AlertCircle },
    } as Record<string, { label: string; cls: string; Icon: ComponentType<{ className?: string }> }>
  )[status] ?? { label: 'Pending', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', Icon: Clock };

  const { label, cls, Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === 'high' ? 'bg-red-400' : severity === 'medium' ? 'bg-amber-400' : 'bg-sky-400';
  return <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${color}`} />;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export function OverwatchPanel({ insight, loading, onClose, onRefresh }: OverwatchPanelProps) {
  return (
    <div className="w-full md:w-100 shrink-0 border-l border-white/10 bg-background/80 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold">Project Overwatch</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!insight ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <BrainCircuit className="h-10 w-10 opacity-20" />
            <p className="text-sm">First analysis in progress…</p>
            <p className="text-xs opacity-60">Check back in a few minutes</p>
          </div>
        ) : (
          <>
            {/* Status + timestamp */}
            <div className="flex items-center justify-between">
              <StatusBadge status={insight.status} />
              {insight.collected_at && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(insight.collected_at)}
                </span>
              )}
            </div>

            {/* Summary */}
            {insight.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.summary}</p>
            )}

            {/* Anomalies */}
            <div>
              <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest mb-2">
                Anomalies {insight.anomalies.length > 0 ? `(${insight.anomalies.length})` : ''}
              </p>
              {insight.anomalies.length === 0 ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">No anomalies detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {insight.anomalies.map((a: OverwatchAnomaly, i: number) => (
                    <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/8">
                      <SeverityDot severity={a.severity} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{a.affected}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {insight.recommendations.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest mb-2">
                  Recommendations
                </p>
                <div className="space-y-1.5">
                  {insight.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <ChevronRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-snug">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
