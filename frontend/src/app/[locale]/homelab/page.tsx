'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';
import {
  ZoomIn, ZoomOut, Maximize, Server as ServerIcon,
  Cpu, MemoryStick, Clock, X, PowerOff, ChevronRight, ChevronLeft,
  Activity, HardDrive, Wifi, Layers, Tag, Box, BrainCircuit,
} from 'lucide-react';
import { AppGroupNode, type AppGroupNodeData } from '@/features/topology/ui/AppGroupNode';
import { NamespaceGroupNode } from '@/features/topology/ui/NamespaceGroupNode';
import { InfrastructureNode, type InfrastructureNodeData } from '@/features/topology/ui/InfrastructureNode';
import { PodNode, type PodNodeData } from '@/features/topology/ui/PodNode';
import { ProxmoxHostNode, type ProxmoxHostNodeData } from '@/features/topology/ui/ProxmoxHostNode';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { detectIconFromContainer } from '@/features/topology/lib/iconMap';
import { getLogLineClassName, splitTimestamp, detectLogLevel } from '@/features/topology/lib/logColorizer';
import type { ContainerInfo, ContainerStats, MetricsRange, AppDependency, NodeInfo, OverwatchInsight, PodInsight } from '@/features/topology/lib/types';
import { OverwatchPanel } from '@/features/topology/ui/OverwatchPanel';
import { useTranslations } from 'next-intl';
import { AnimatedBackground } from '@/shared/ui/AnimatedBackground';

const nodeTypes: NodeTypes = {
  appGroupNode: AppGroupNode,
  namespaceGroupNode: NamespaceGroupNode,
  infrastructureNode: InfrastructureNode,
  podNode: PodNode,
  proxmoxHostNode: ProxmoxHostNode,
};

const POLL_INTERVAL = 10_000;
const NS_ORDER = ['portfolio', 'networking', 'monitoring', 'media', 'homelab-ai', 'argocd', 'secrets'];

// localStorage settings
const SETTINGS_KEY = 'homelab_app_settings';
type AppSettings = { visible: boolean; showLogs: boolean; displayName: string; icon?: string };

function loadSettings(): Map<string, AppSettings> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [string, AppSettings][]);
  } catch { return new Map(); }
}

type TimeRange = '5m' | '15m' | '1h' | '24h';
type LogFilter = 'all' | 'err' | 'wrn' | 'inf' | 'dbg' | 'ok';
const LOG_FILTER_OPTIONS: { key: LogFilter; label: string; badge: string }[] = [
  { key: 'all', label: 'All', badge: '' },
  { key: 'err', label: 'ERR', badge: 'ERR' },
  { key: 'wrn', label: 'WRN', badge: 'WRN' },
  { key: 'inf', label: 'INF', badge: 'INF' },
  { key: 'dbg', label: 'DBG', badge: 'DBG' },
  { key: 'ok', label: 'OK', badge: 'OK' },
];
const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '24h', value: '24h' },
];

interface AppGroup {
  id: string;
  appName: string;
  namespace: string;
  pods: ContainerInfo[];
  icon: string | null;
  image: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function ChartTooltip({ active, payload, label, unit = '%' }: {
  active?: boolean; payload?: { value: number }[]; label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 shadow-md text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold tabular-nums">{payload[0].value.toFixed(2)}{unit}</p>
    </div>
  );
}

// --- Pod detail panel ---
function PodDetailPanel({
  pod, onBack, onClose, isSingle, showLogs, t,
}: {
  pod: ContainerInfo; onBack: () => void; onClose?: () => void; isSingle?: boolean; showLogs: boolean; t: (key: string) => string;
}) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');
  const [prometheusRange, setPrometheusRange] = useState<MetricsRange | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStats(null); setLogs([]); setPrometheusRange(null); setLogsLoading(true);
    async function load() {
      const [statsData, logsData] = await Promise.all([
        topologyApi.getContainerStats(pod.id).catch(() => null),
        showLogs ? topologyApi.getContainerLogs(pod.id, 80).catch(() => null) : null,
      ]);
      if (statsData) setStats(statsData);
      if (logsData) setLogs(logsData.lines);
      setLogsLoading(false);
    }
    load();
    intervalRef.current = setInterval(async () => {
      try { const data = await topologyApi.getContainerStats(pod.id); setStats(data); } catch { /* ignore */ }
    }, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pod.id, showLogs]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRange() {
      try {
        const ns = pod.networks[0] || '';
        const metricsId = ns ? `${ns}/${pod.name}` : pod.name;
        const data = await topologyApi.getMetricsRange(timeRange, metricsId);
        if (!cancelled) setPrometheusRange(data);
      } catch { if (!cancelled) setPrometheusRange(null); }
    }
    fetchRange();
    const id = setInterval(fetchRange, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [timeRange, pod.id]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const chartData = prometheusRange && prometheusRange.cpu.length > 0
    ? prometheusRange.cpu.map((pt, i) => ({
        time: pt.time,
        cpu: pt.value,
        memory: (prometheusRange.memory[i]?.value ?? 0) / 1024 / 1024,
      }))
    : null;

  const filteredLogs = logFilter === 'all'
    ? logs
    : logs.filter((line) => {
        const level = detectLogLevel(line);
        return level?.badge === LOG_FILTER_OPTIONS.find((f) => f.key === logFilter)?.badge;
      });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 shrink-0">
        {!isSingle && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onBack}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold truncate">{pod.appName || pod.name}</p>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${
              pod.state === 'running' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'
            }`}>{pod.state}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{pod.name}</p>
        </div>
        {isSingle && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 border-b border-white/10 shrink-0">
          <TabsList variant="line">
            <TabsTrigger value="metrics">{t('resources')}</TabsTrigger>
            {showLogs && <TabsTrigger value="logs">{t('recentLogs')}</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="metrics" className="flex-1 overflow-y-auto m-0">
          <div className="p-4 space-y-4">
            {pod.state !== 'running' ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="rounded-full bg-muted p-4"><PowerOff className="h-5 w-5 text-muted-foreground" /></div>
                <p className="text-sm font-medium">Pod Offline</p>
                <p className="text-xs text-muted-foreground capitalize">{pod.state}</p>
              </div>
            ) : (
              <>
                {stats ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3">
                      <div className="flex items-center gap-1.5 mb-1"><Cpu className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">CPU</span></div>
                      <p className="text-base font-bold">{stats.cpuPercent.toFixed(1)}%</p>
                      <Progress value={Math.min(stats.cpuPercent, 100)} className="h-1 mt-1.5" />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3">
                      <div className="flex items-center gap-1.5 mb-1"><MemoryStick className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Mem</span></div>
                      <p className="text-base font-bold">{formatBytes(stats.memoryUsage)}</p>
                      <Progress value={Math.min(stats.memoryPercent, 100)} className="h-1 mt-1.5" />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3">
                      <div className="flex items-center gap-1.5 mb-1"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Status</span></div>
                      <p className="text-base font-bold capitalize">{pod.state}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3">
                        <Skeleton className="h-3 w-10 mb-1.5" /><Skeleton className="h-5 w-14 mt-1" /><Skeleton className="h-1 mt-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground">CPU %</p>
                  <div className="flex gap-1">
                    {TIME_RANGES.map((r) => (
                      <button key={r.value} onClick={() => setTimeRange(r.value)}
                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${timeRange === r.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>

                {prometheusRange === null ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><Skeleton className="h-28 w-full rounded" /></div>
                ) : chartData === null ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3 flex items-center justify-center h-28">
                    <p className="text-xs text-muted-foreground">Collecting metrics…</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient></defs>
                        <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={26} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="cpu" stroke="hsl(var(--chart-1))" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div></div>
                )}

                <p className="text-[11px] font-medium text-muted-foreground">Memory (MB)</p>
                {prometheusRange === null ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><Skeleton className="h-28 w-full rounded" /></div>
                ) : chartData === null ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3 flex items-center justify-center h-28">
                    <p className="text-xs text-muted-foreground">Collecting metrics…</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient></defs>
                        <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v.toFixed(0)}`} />
                        <Tooltip content={<ChartTooltip unit=" MB" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" fill="url(#memGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div></div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {showLogs && (
          <TabsContent value="logs" className="flex-1 m-0 flex flex-col min-h-0">
            {/* Filter bar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/8 bg-black/20 shrink-0">
              {LOG_FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLogFilter(f.key)}
                  className={`px-2 py-0.5 text-[9px] font-semibold rounded transition-all ${
                    logFilter === f.key
                      ? f.key === 'all'
                        ? 'bg-white/10 text-foreground'
                        : f.key === 'err'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : f.key === 'wrn'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : f.key === 'inf'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : f.key === 'dbg'
                                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-[9px] text-muted-foreground tabular-nums">
                {filteredLogs.length} line{filteredLogs.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Log content */}
            <div className="flex-1 overflow-y-auto bg-black/30 font-mono text-[11px] leading-5">
              {logsLoading ? (
                <p className="text-muted-foreground text-center py-8">{t('loadingLogs')}</p>
              ) : filteredLogs.length > 0 ? (
                <table className="w-full border-collapse">
                  <tbody>
                    {filteredLogs.map((line, i) => {
                      const { timestamp, rest } = splitTimestamp(line);
                      const colorClass = getLogLineClassName(line);
                      const level = detectLogLevel(line);
                      return (
                        <tr key={i} className="hover:bg-white/4 group">
                          {/* Timestamp gutter */}
                          <td className="pl-3 pr-2 py-0.5 text-[10px] text-gray-600 tabular-nums whitespace-nowrap align-top select-none w-17">
                            {timestamp ?? ''}
                          </td>
                          {/* Level badge */}
                          <td className="pr-2 py-0.5 align-top w-8.5">
                            {level ? (
                              <span className={`inline-block text-[8px] font-bold px-1 py-px rounded border ${level.badgeClass} leading-tight`}>
                                {level.badge}
                              </span>
                            ) : null}
                          </td>
                          {/* Message */}
                          <td className={`pr-3 py-0.5 align-top break-all ${colorClass}`}>
                            {rest}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : logFilter !== 'all' ? (
                <p className="text-muted-foreground text-center py-8 text-xs">No {logFilter.toUpperCase()} logs</p>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-xs">{t('noLogs')}</p>
              )}
              <div ref={logsEndRef} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// --- App group panel ---
function AppGroupPanel({
  group, onClose, t, showLogs,
}: {
  group: AppGroup;
  onClose: () => void;
  t: (key: string) => string;
  showLogs: boolean;
}) {
  const activePods = group.pods.filter((p) => p.state !== 'succeeded' && p.state !== 'completed');
  const [selectedPod, setSelectedPod] = useState<ContainerInfo | null>(null);

  const isSingle = activePods.length === 1;

  if (selectedPod) {
    return (
      <div className="w-full md:w-[48%] shrink-0 border-l border-white/10 bg-background/80 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
        <PodDetailPanel
          pod={selectedPod}
          onBack={() => setSelectedPod(null)}
          onClose={onClose}
          isSingle={isSingle}
          showLogs={showLogs}
          t={t}
        />
      </div>
    );
  }

  const running = activePods.filter((p) => p.state === 'running').length;
  const pending = activePods.filter((p) => p.state === 'pending').length;
  const failed = activePods.length - running - pending;

  const initials = group.appName.split(/[-_]/).map((w) => w[0]?.toUpperCase() || '').join('').slice(0, 2);
  const baseImage = group.image?.split('/').pop()?.split(':')[0] ?? group.appName;
  const imageTag = group.image?.split(':')[1] ?? 'latest';
  const imageRegistry = group.image?.includes('/') ? group.image.split('/').slice(0, -1).join('/') : 'docker.io';
  const healthPct = activePods.length > 0 ? (running / activePods.length) * 100 : 0;

  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [podInsight, setPodInsight] = useState<PodInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const fetchPodInsight = useCallback(async () => {
    if (insightLoading) return;
    setInsightLoading(true);
    setInsightError(null);
    try {
      const data = await topologyApi.getPodInsights(group.namespace, group.appName);
      setPodInsight(data);
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : 'Service unavailable');
    } finally {
      setInsightLoading(false);
    }
  }, [group.namespace, group.appName, insightLoading]);

  return (
    <div className="w-full md:w-[48%] shrink-0 border-l border-white/10 bg-background/80 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {group.icon ? (
            <Image src={group.icon} alt="" width={22} height={22} unoptimized />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{group.appName}</h3>
            <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">{group.namespace}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{running}/{activePods.length} running</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/10 shrink-0 px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-1 py-2.5 text-xs font-medium mr-4 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-violet-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >Overview</button>
        <button
          onClick={() => { setActiveTab('insights'); fetchPodInsight(); }}
          className={`px-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'insights' ? 'border-violet-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <BrainCircuit className="h-3 w-3" />
          AI Insights
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <>
            {/* Pod health bar */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pod Health</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{running}/{activePods.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${healthPct === 100 ? 'bg-green-500' : healthPct > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${healthPct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                {running > 0 && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[10px] text-muted-foreground">{running} running</span></div>}
                {pending > 0 && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /><span className="text-[10px] text-muted-foreground">{pending} pending</span></div>}
                {failed > 0 && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[10px] text-muted-foreground">{failed} failed</span></div>}
              </div>
            </div>

            {/* Pods section */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-2">Pods</p>
              <div className="space-y-1.5">
                {activePods.map((pod) => {
                  const isRunning = pod.state === 'running';
                  const isPending = pod.state === 'pending';
                  const accentColor = isRunning ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-red-500';
                  const podImageName = pod.image?.split('/').pop()?.split(':')[0] ?? '';
                  const podImageTag = pod.image?.split(':')[1] ?? 'latest';
                  return (
                    <button key={pod.id} onClick={() => setSelectedPod(pod)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left group relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accentColor} opacity-70`} />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${accentColor} ${isRunning ? 'shadow-[0_0_6px_2px_rgba(34,197,94,0.3)]' : ''}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate leading-tight">{pod.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground capitalize">{pod.state}</span>
                          {podImageName && (
                            <>
                              <span className="text-[10px] text-white/20">·</span>
                              <span className="text-[10px] text-muted-foreground/70 truncate">{podImageName}</span>
                              <span className="text-[9px] text-white/20 font-mono shrink-0">:{podImageTag}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* App info section */}
            <div className="px-3 pt-4 pb-4">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-2">App Info</p>
              <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/6 overflow-hidden">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0">Image</span>
                  <span className="text-[11px] font-medium truncate">{baseImage}</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0">Tag</span>
                  <span className="text-[11px] font-mono text-violet-400/80">{imageTag}</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0">Namespace</span>
                  <span className="text-[11px] font-medium">{group.namespace}</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <ServerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground w-16 shrink-0">Registry</span>
                  <span className="text-[11px] text-muted-foreground/70 truncate font-mono">{imageRegistry}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'insights' && (
          <div className="p-4 space-y-3">
            {insightLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <BrainCircuit className="h-8 w-8 text-violet-400/40 animate-pulse" />
                <p className="text-xs text-muted-foreground">Analyzing {group.appName}…</p>
              </div>
            ) : podInsight ? (
              <>
                {/* Status badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  podInsight.status === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : podInsight.status === 'warning'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : podInsight.status === 'critical'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-white/5 text-muted-foreground border-white/10'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    podInsight.status === 'healthy' ? 'bg-emerald-400' :
                    podInsight.status === 'warning' ? 'bg-amber-400' :
                    podInsight.status === 'critical' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  {podInsight.status.charAt(0).toUpperCase() + podInsight.status.slice(1)}
                </div>

                {/* Diagnosis */}
                <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Diagnosis</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{podInsight.diagnosis}</p>
                </div>

                {/* Root cause */}
                <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Root Cause</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{podInsight.root_cause}</p>
                </div>

                {/* Suggestions */}
                {podInsight.suggestions.length > 0 && (
                  <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</p>
                    <ul className="space-y-1.5">
                      {podInsight.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400/60 shrink-0" />
                          <span className="text-xs text-foreground/70 leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/50 text-right">
                  Analyzed {new Date(podInsight.analyzed_at).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <BrainCircuit className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">
                  {insightError ?? 'No insights available'}
                </p>
                <button
                  onClick={fetchPodInsight}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Node detail panel ---
function NodeDetailPanel({
  node, onClose, t,
}: {
  node: NodeInfo; onClose: () => void; t: (key: string) => string;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');
  const [metricsRange, setMetricsRange] = useState<MetricsRange | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchRange() {
      try {
        const data = await topologyApi.getNodeMetricsRange(node.name, timeRange);
        if (!cancelled) setMetricsRange(data);
      } catch { if (!cancelled) setMetricsRange(null); }
    }
    fetchRange();
    const id = setInterval(fetchRange, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [timeRange, node.name]);

  const lastPoint = metricsRange && metricsRange.cpu.length > 0
    ? {
        cpu: metricsRange.cpu.at(-1)?.value ?? null,
        memory: metricsRange.memory.at(-1)?.value ?? null,
        networkRx: (metricsRange.networkRx.at(-1)?.value ?? null),
        networkTx: (metricsRange.networkTx.at(-1)?.value ?? null),
        diskRead: (metricsRange.diskRead.at(-1)?.value ?? null),
        diskWrite: (metricsRange.diskWrite.at(-1)?.value ?? null),
      }
    : null;

  const chartData = metricsRange && metricsRange.cpu.length > 0
    ? metricsRange.cpu.map((pt, i) => ({
        time: pt.time,
        cpu: pt.value,
        memory: metricsRange.memory[i]?.value ?? 0,
        networkRx: (metricsRange.networkRx[i]?.value ?? 0) / 1024,
        networkTx: (metricsRange.networkTx[i]?.value ?? 0) / 1024,
        diskRead: (metricsRange.diskRead[i]?.value ?? 0) / 1024 / 1024,
        diskWrite: (metricsRange.diskWrite[i]?.value ?? 0) / 1024 / 1024,
      }))
    : null;

  const GlassCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3">{children}</div>
  );
  const ChartCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><div className="h-28">{children}</div></div>
  );
  const EmptyChart = () => (
    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3 flex items-center justify-center h-33">
      <p className="text-xs text-muted-foreground">Collecting metrics…</p>
    </div>
  );
  const SkeletonChart = () => (
    <div className="rounded-xl border border-white/10 bg-white/5 pt-3 pb-2.5 px-3"><Skeleton className="h-28 w-full rounded" /></div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{node.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
              node.status === 'Ready'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            }`}>{node.status}</span>
          </div>
          <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{node.role}{node.cpuCores > 0 ? ` · ${node.cpuCores} CPU · ${node.memoryGB.toFixed(0)} GB RAM` : ''}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Current stats */}
        <div className="grid grid-cols-2 gap-2">
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><Cpu className="h-3 w-3 text-violet-400" /><span className="text-[10px] text-muted-foreground">CPU</span></div>
            <p className="text-base font-bold">{lastPoint?.cpu != null ? `${lastPoint.cpu.toFixed(1)}%` : '—'}</p>
            {lastPoint?.cpu != null && <Progress value={Math.min(lastPoint.cpu, 100)} className="h-1 mt-1.5" />}
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><MemoryStick className="h-3 w-3 text-blue-400" /><span className="text-[10px] text-muted-foreground">Memory</span></div>
            <p className="text-base font-bold">{lastPoint?.memory != null ? `${lastPoint.memory.toFixed(1)}%` : '—'}</p>
            {lastPoint?.memory != null && <Progress value={Math.min(lastPoint.memory, 100)} className="h-1 mt-1.5" />}
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><Wifi className="h-3 w-3 text-cyan-400" /><span className="text-[10px] text-muted-foreground">Net RX</span></div>
            <p className="text-sm font-bold">{lastPoint?.networkRx != null ? `${(lastPoint.networkRx / 1024).toFixed(1)} KB/s` : '—'}</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><Wifi className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-muted-foreground">Net TX</span></div>
            <p className="text-sm font-bold">{lastPoint?.networkTx != null ? `${(lastPoint.networkTx / 1024).toFixed(1)} KB/s` : '—'}</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><HardDrive className="h-3 w-3 text-orange-400" /><span className="text-[10px] text-muted-foreground">Disk Read</span></div>
            <p className="text-sm font-bold">{lastPoint?.diskRead != null ? `${(lastPoint.diskRead / 1024 / 1024).toFixed(2)} MB/s` : '—'}</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-1.5 mb-1"><HardDrive className="h-3 w-3 text-rose-400" /><span className="text-[10px] text-muted-foreground">Disk Write</span></div>
            <p className="text-sm font-bold">{lastPoint?.diskWrite != null ? `${(lastPoint.diskWrite / 1024 / 1024).toFixed(2)} MB/s` : '—'}</p>
          </GlassCard>
        </div>

        {/* Time range */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">Time range</p>
          <div className="flex gap-1">
            {TIME_RANGES.map((r) => (
              <button key={r.value} onClick={() => setTimeRange(r.value)}
                className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${timeRange === r.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >{r.label}</button>
            ))}
          </div>
        </div>

        {/* CPU chart */}
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3 text-violet-400" />CPU %</p>
        {metricsRange === null ? <SkeletonChart /> : chartData === null ? <EmptyChart /> : (
          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="nodeCpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(265 75% 65%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(265 75% 65%)" stopOpacity={0} />
                </linearGradient></defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={26} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="cpu" stroke="hsl(265 75% 65%)" fill="url(#nodeCpuGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Memory chart */}
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5"><MemoryStick className="h-3 w-3 text-blue-400" />Memory %</p>
        {metricsRange === null ? <SkeletonChart /> : chartData === null ? <EmptyChart /> : (
          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="nodeMemGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220 80% 65%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(220 80% 65%)" stopOpacity={0} />
                </linearGradient></defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="memory" stroke="hsl(220 80% 65%)" fill="url(#nodeMemGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Network chart */}
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5"><Wifi className="h-3 w-3 text-cyan-400" />Network (KB/s)</p>
        {metricsRange === null ? <SkeletonChart /> : chartData === null ? <EmptyChart /> : (
          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="nodeRxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(195 90% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(195 90% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nodeTxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 70% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160 70% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v.toFixed(0)}`} />
                <Tooltip content={<ChartTooltip unit=" KB/s" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="networkRx" stroke="hsl(195 90% 60%)" fill="url(#nodeRxGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="RX" />
                <Area type="monotone" dataKey="networkTx" stroke="hsl(160 70% 55%)" fill="url(#nodeTxGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="TX" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Disk I/O chart */}
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5"><HardDrive className="h-3 w-3 text-orange-400" />Disk I/O (MB/s)</p>
        {metricsRange === null ? <SkeletonChart /> : chartData === null ? <EmptyChart /> : (
          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="nodeDiskReadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38 90% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38 90% 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nodeDiskWriteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(342 75% 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(342 75% 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v.toFixed(1)}`} />
                <Tooltip content={<ChartTooltip unit=" MB/s" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="diskRead" stroke="hsl(38 90% 60%)" fill="url(#nodeDiskReadGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Read" />
                <Area type="monotone" dataKey="diskWrite" stroke="hsl(342 75% 65%)" fill="url(#nodeDiskWriteGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Write" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// --- Layout constants ---
const APPS_PER_ROW = 4;
const APP_W = 155;
const APP_H = 64;
const APP_GAP_X = 48;
const NS_PAD_X = 56;
const NS_PAD_Y = 48;
const NS_HEADER = 40;
const ROW_GAP = 92;
const NS_COL_GAP = 108;
const NS_GRID_COLS = 2;
const TIER_GAP = 100;
const PROXMOX_NODE_H = 100;
const INFRA_NODE_H = 88;
const INFRA_TIER_GAP = 72;


/** Compute depth-from-deepest-leaf for each app using dependency edges within a namespace. */
function computeDepths(apps: AppGroup[], deps: AppDependency[]): Map<string, number> {
  const ids = new Set(apps.map((a) => a.id));
  // outEdges[id] = list of dependency ids (what this app depends on)
  const outEdges = new Map<string, string[]>(apps.map((a) => [a.id, []]));

  for (const dep of deps) {
    const srcId = `${dep.sourceNamespace}/${dep.sourceApp}`;
    const tgtId = `${dep.targetNamespace}/${dep.targetApp}`;
    if (ids.has(srcId) && ids.has(tgtId)) {
      outEdges.get(srcId)!.push(tgtId);
    }
  }

  const depths = new Map<string, number>();
  function getDepth(id: string, visited = new Set<string>()): number {
    if (depths.has(id)) return depths.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const successors = outEdges.get(id) ?? [];
    const d = successors.length === 0 ? 0 : 1 + Math.max(...successors.map((s) => getDepth(s, new Set(visited))));
    depths.set(id, d);
    return d;
  }
  for (const app of apps) getDepth(app.id);
  return depths;
}

/** Group apps by depth level (descending depth = row 0 at top). */
function groupByLevel(apps: AppGroup[], depths: Map<string, number>): AppGroup[][] {
  const maxDepth = Math.max(0, ...Array.from(depths.values()));
  const levels: AppGroup[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const app of apps) {
    const d = depths.get(app.id) ?? 0;
    // Higher depth = closer to top (more "upstream")
    levels[maxDepth - d].push(app);
  }
  return levels.filter((l) => l.length > 0);
}

function nsBoxDims(levels: AppGroup[][]): { w: number; h: number } {
  let maxRowW = 0;
  for (const row of levels) {
    const rowW = Math.min(row.length, APPS_PER_ROW) * (APP_W + APP_GAP_X) - APP_GAP_X;
    if (rowW > maxRowW) maxRowW = rowW;
  }
  const w = maxRowW + NS_PAD_X * 2;

  let h = NS_HEADER + NS_PAD_Y;
  let firstSubRow = true;
  for (const levelApps of levels) {
    const numSubRows = Math.ceil(levelApps.length / APPS_PER_ROW);
    for (let sr = 0; sr < numSubRows; sr++) {
      if (!firstSubRow) h += ROW_GAP;
      firstSubRow = false;
      const subRowApps = levelApps.slice(sr * APPS_PER_ROW, (sr + 1) * APPS_PER_ROW);
      h += APP_H;
    }
  }
  h += NS_PAD_Y + 8;
  return { w, h };
}

function groupContainersToApps(containers: ContainerInfo[]): AppGroup[] {
  const map = new Map<string, AppGroup>();
  for (const c of containers) {
    const ns = c.networks[0] || 'default';
    const app = c.appName || deriveAppName(c.name);
    const key = `${ns}/${app}`;
    if (!map.has(key)) {
      map.set(key, { id: key, appName: app, namespace: ns, pods: [], icon: detectIconFromContainer(c.image || '', app), image: c.image });
    }
    map.get(key)!.pods.push(c);
  }
  return Array.from(map.values());
}

function deriveAppName(podName: string): string {
  let name = podName.replace(/^portfolio_/, '');
  name = name.replace(/-\d+$/, '');
  for (let i = 0; i < 2; i++) {
    const idx = name.lastIndexOf('-');
    if (idx === -1) break;
    const suffix = name.slice(idx + 1);
    if (suffix.length >= 5 && suffix.length <= 12 && /^[a-z0-9]+$/.test(suffix)) {
      name = name.slice(0, idx);
    } else break;
  }
  return name || podName;
}

function buildFlow(groups: AppGroup[], deps: AppDependency[], k8sNodes: NodeInfo[]): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const edgeList: Edge[] = [];
  const seen = new Set<string>();

  const addEdge = (
    source: string, target: string, dashed = false, type = 'smoothstep',
    sourceHandle?: string, targetHandle?: string,
  ) => {
    const key = `${source}--${target}`;
    if (seen.has(key) || source === target) return;
    seen.add(key);
    edgeList.push({
      id: key, source, target, type, animated: false,
      sourceHandle: sourceHandle ?? null,
      targetHandle: targetHandle ?? null,
      style: dashed
        ? { stroke: 'hsl(220 80% 65% / 0.35)', strokeWidth: 1.2, strokeDasharray: '5 4' }
        : { stroke: 'hsl(265 75% 65% / 0.4)', strokeWidth: 1.5 },
    });
  };

  const sortNs = (a: string, b: string) => {
    const ai = NS_ORDER.indexOf(a), bi = NS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  };

  const networkingGroups = groups.filter((g) => g.namespace === 'networking');
  const otherGroups = groups.filter((g) => g.namespace !== 'networking');
  const otherNamespaces = [...new Set(otherGroups.map((g) => g.namespace))].sort(sortNs);

  // Precompute levels + dims for each namespace
  const nsLevels = new Map<string, AppGroup[][]>();
  const nsDimsMap = new Map<string, { w: number; h: number }>();
  for (const ns of otherNamespaces) {
    const nsGroups = otherGroups.filter((g) => g.namespace === ns);
    const depths = computeDepths(nsGroups, deps);
    const levels = groupByLevel(nsGroups, depths);
    nsLevels.set(ns, levels);
    nsDimsMap.set(ns, nsBoxDims(levels));
  }

  const colWidths: number[] = Array(NS_GRID_COLS).fill(0);
  otherNamespaces.forEach((ns, i) => {
    const d = nsDimsMap.get(ns)!;
    colWidths[i % NS_GRID_COLS] = Math.max(colWidths[i % NS_GRID_COLS], d.w);
  });
  const totalGridW = colWidths.reduce((s, w) => s + w, 0) + NS_COL_GAP * (NS_GRID_COLS - 1);

  const gwCount = networkingGroups.length;
  const gwTierW = gwCount > 0 ? gwCount * (APP_W + APP_GAP_X) - APP_GAP_X : 0;
  const proxmoxW = 340;
  const PROXMOX_GAP = 24;

  // Group k8s nodes by Proxmox host label
  const hostMap = new Map<string, NodeInfo[]>();
  for (const node of k8sNodes) {
    const host = node.proxmoxHost || '';
    if (!hostMap.has(host)) hostMap.set(host, []);
    hostMap.get(host)!.push(node);
  }
  // If no label data yet, treat all as one unnamed host
  const hostKeys = k8sNodes.length > 0 && [...hostMap.keys()].some((k) => k !== '')
    ? [...hostMap.keys()].filter((k) => k !== '').sort()
    : [''];
  if (hostMap.has('') && hostKeys[0] !== '') {
    // merge unlabeled nodes into first host for fallback
    const unlabeled = hostMap.get('')!;
    if (!hostMap.has(hostKeys[0])) hostMap.set(hostKeys[0], []);
    hostMap.get(hostKeys[0])!.push(...unlabeled);
  }

  const proxmoxTierW = hostKeys.length * proxmoxW + (hostKeys.length - 1) * PROXMOX_GAP;
  const canvasW = Math.max(totalGridW, gwTierW, proxmoxTierW, 500);
  const centerX = canvasW / 2;

  // 1. Infrastructure chain: Internet → Router → ProxmoxHost(s)
  let yOffset = 0;

  flowNodes.push({
    id: '__internet', type: 'infrastructureNode',
    position: { x: centerX - 40, y: yOffset },
    draggable: false, selectable: false,
    data: { label: 'Internet', infrastructureType: 'internet' } satisfies InfrastructureNodeData,
  });
  yOffset += INFRA_NODE_H + INFRA_TIER_GAP;

  flowNodes.push({
    id: '__router', type: 'infrastructureNode',
    position: { x: centerX - 40, y: yOffset },
    draggable: false, selectable: false,
    data: { label: 'Home Router', infrastructureType: 'router' } satisfies InfrastructureNodeData,
  });
  addEdge('__internet', '__router');
  yOffset += INFRA_NODE_H + INFRA_TIER_GAP;

  // Render one ProxmoxHostNode per physical host, laid out side-by-side
  const proxmoxHostIds: string[] = [];
  const proxmoxStartX = centerX - proxmoxTierW / 2;
  hostKeys.forEach((hostKey, i) => {
    const proxmoxId = hostKey ? `__proxmox_${hostKey}` : '__proxmox';
    const hostNodes = hostMap.get(hostKey) ?? (k8sNodes.length === 0 ? k8sNodes : []);
    flowNodes.push({
      id: proxmoxId, type: 'proxmoxHostNode',
      position: { x: proxmoxStartX + i * (proxmoxW + PROXMOX_GAP), y: yOffset },
      draggable: false, selectable: false,
      data: { k8sNodes: hostNodes, label: hostKey || undefined } satisfies ProxmoxHostNodeData,
    });
    addEdge('__router', proxmoxId);
    proxmoxHostIds.push(proxmoxId);
  });
  yOffset += PROXMOX_NODE_H + INFRA_TIER_GAP;

  // 2. Networking / gateway tier
  const gatewayIds: string[] = [];
  if (gwCount > 0) {
    const gwStartX = centerX - gwTierW / 2;

    // Compute networking levels
    const netDepths = computeDepths(networkingGroups, deps);
    const netLevels = groupByLevel(networkingGroups, netDepths);
    let gwY = yOffset;

    netLevels.forEach((levelApps) => {
      const rowW = levelApps.length * (APP_W + APP_GAP_X) - APP_GAP_X;
      const rowStartX = gwStartX + (gwTierW - rowW) / 2;
      levelApps.forEach((g, i) => {
        const gx = rowStartX + i * (APP_W + APP_GAP_X);
        flowNodes.push({
          id: g.id, type: 'appGroupNode',
          position: { x: gx, y: gwY },
          draggable: false,
          data: { appName: g.appName, namespace: g.namespace, pods: g.pods, icon: g.icon } satisfies AppGroupNodeData,
        });
        // Connect from the first proxmox host (or all if only one)
        for (const proxmoxId of proxmoxHostIds) {
          addEdge(proxmoxId, g.id, false, 'smoothstep', undefined, 'target-top');
        }
        gatewayIds.push(g.id);
      });

      // Intra-networking dep edges within this level's context
      gwY += APP_H + ROW_GAP;
    });

    yOffset = gwY - ROW_GAP + TIER_GAP;

    // Draw networking inter-app dep edges
    const netIds = new Set(networkingGroups.map((g) => g.id));
    for (const dep of deps) {
      const srcId = `${dep.sourceNamespace}/${dep.sourceApp}`;
      const tgtId = `${dep.targetNamespace}/${dep.targetApp}`;
      if (netIds.has(srcId) && netIds.has(tgtId)) {
        addEdge(srcId, tgtId, false, 'smoothstep', 'source-bottom', 'target-top');
      }
    }
  }

  // 3. Namespace grid (2-column)
  const colXOffsets: number[] = [];
  const gridStartX = centerX - totalGridW / 2;
  let xCursor = gridStartX;
  for (let c = 0; c < NS_GRID_COLS; c++) { colXOffsets.push(xCursor); xCursor += colWidths[c] + NS_COL_GAP; }

  const rowCount = Math.ceil(otherNamespaces.length / NS_GRID_COLS);
  const rowHeights: number[] = Array(rowCount).fill(0);
  otherNamespaces.forEach((ns, i) => {
    const h = nsDimsMap.get(ns)!.h;
    rowHeights[Math.floor(i / NS_GRID_COLS)] = Math.max(rowHeights[Math.floor(i / NS_GRID_COLS)], h);
  });
  const rowYOffsets: number[] = [];
  let ryCursor = yOffset;
  for (let r = 0; r < rowCount; r++) { rowYOffsets.push(ryCursor); ryCursor += rowHeights[r] + ROW_GAP; }

  otherNamespaces.forEach((ns, idx) => {
    const col = idx % NS_GRID_COLS;
    const row = Math.floor(idx / NS_GRID_COLS);
    const nsX = colXOffsets[col];
    const nsY = rowYOffsets[row];
    const { w: nsW, h: nsH } = nsDimsMap.get(ns)!;
    const levels = nsLevels.get(ns)!;

    flowNodes.push({
      id: `ns__${ns}`, type: 'namespaceGroupNode',
      position: { x: nsX, y: nsY },
      style: { width: nsW, height: nsH, zIndex: -1 },
      data: { namespace: ns, podCount: otherGroups.filter((g) => g.namespace === ns).reduce((s, g) => s + g.pods.length, 0) },
      selectable: false, draggable: false,
    });

    // Position apps by depth level (split into sub-rows of APPS_PER_ROW)
    let levelY = NS_HEADER + NS_PAD_Y;
    for (const levelApps of levels) {
      const numSubRows = Math.ceil(levelApps.length / APPS_PER_ROW);
      for (let sr = 0; sr < numSubRows; sr++) {
        const subRowApps = levelApps.slice(sr * APPS_PER_ROW, (sr + 1) * APPS_PER_ROW);
        const subRowW = subRowApps.length * (APP_W + APP_GAP_X) - APP_GAP_X;
        const rowStartX = NS_PAD_X + (nsW - NS_PAD_X * 2 - subRowW) / 2;

        subRowApps.forEach((group, gi) => {
          const appRelX = rowStartX + gi * (APP_W + APP_GAP_X);
          const appRelY = levelY;

          flowNodes.push({
            id: group.id, type: 'appGroupNode',
            parentId: `ns__${ns}`,
            extent: 'parent' as const,
            position: { x: appRelX, y: appRelY },
            draggable: false,
            data: { appName: group.appName, namespace: group.namespace, pods: group.pods, icon: group.icon } satisfies AppGroupNodeData,
          });
        });

        levelY += APP_H + ROW_GAP;
      }
    }

    // Draw intra-namespace dependency edges between app group nodes
    const nsIds = new Set(otherGroups.filter((g) => g.namespace === ns).map((g) => g.id));
    for (const dep of deps) {
      const srcId = `${dep.sourceNamespace}/${dep.sourceApp}`;
      const tgtId = `${dep.targetNamespace}/${dep.targetApp}`;
      if (nsIds.has(srcId) && nsIds.has(tgtId)) {
        addEdge(srcId, tgtId, false, 'smoothstep', 'source-bottom', 'target-top');
      }
    }
  });

  // Draw cross-namespace dependency edges — route to/from namespace group boundary.
  // Pick source/target handles to find the shortest, most direct path.
  const allAppIds = new Set(groups.map((g) => g.id));
  const nsBoxIds = new Set(otherNamespaces.map((ns) => `ns__${ns}`));
  const nsRowIndex = new Map<string, number>();
  const nsColIndex = new Map<string, number>();
  otherNamespaces.forEach((ns, idx) => {
    nsRowIndex.set(ns, Math.floor(idx / NS_GRID_COLS));
    nsColIndex.set(ns, idx % NS_GRID_COLS);
  });

  for (const dep of deps) {
    const srcId = `${dep.sourceNamespace}/${dep.sourceApp}`;
    const tgtId = `${dep.targetNamespace}/${dep.targetApp}`;
    if (!allAppIds.has(srcId) || !allAppIds.has(tgtId)) continue;
    if (dep.sourceNamespace === dep.targetNamespace) continue;
    const srcNode = nsBoxIds.has(`ns__${dep.sourceNamespace}`) ? `ns__${dep.sourceNamespace}` : srcId;
    const tgtNode = nsBoxIds.has(`ns__${dep.targetNamespace}`) ? `ns__${dep.targetNamespace}` : tgtId;

    const srcRow = nsRowIndex.get(dep.sourceNamespace) ?? -1; // -1 = networking tier (above grid)
    const tgtRow = nsRowIndex.get(dep.targetNamespace) ?? -1;
    const srcCol = nsColIndex.get(dep.sourceNamespace) ?? -1;
    const tgtCol = nsColIndex.get(dep.targetNamespace) ?? -1;

    let srcHandle: string | undefined;
    let tgtHandle: string | undefined;

    if (srcNode.startsWith('ns__') && tgtNode.startsWith('ns__')) {
      if (srcRow === tgtRow) {
        // Same grid row — shortest path is horizontal (left ↔ right)
        srcHandle = srcCol < tgtCol ? 'source-right' : 'source-left';
        tgtHandle = srcCol < tgtCol ? 'target-left'  : 'target-right';
      } else if (srcRow < tgtRow) {
        // Source above target — go straight down
        srcHandle = 'source-bottom'; tgtHandle = 'target-top';
      } else {
        // Source below target — go straight up
        srcHandle = 'source-top'; tgtHandle = 'target-bottom';
      }
    } else if (srcNode.startsWith('ns__')) {
      // Namespace box (below) → networking tier app (above): exit top, enter bottom
      srcHandle = 'source-top';
      tgtHandle = 'target-bottom';
    } else if (tgtNode.startsWith('ns__')) {
      // Networking tier app (above) → namespace box (below): exit bottom, enter top
      srcHandle = 'source-bottom';
      tgtHandle = 'target-top';
    }

    addEdge(srcNode, tgtNode, true, 'smoothstep', srcHandle, tgtHandle);
  }

  return { nodes: flowNodes, edges: edgeList };
}

// --- Main canvas ---
function TopologyCanvas() {
  const t = useTranslations('homelab');
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [liveContainers, setLiveContainers] = useState<ContainerInfo[]>([]);
  const [deps, setDeps] = useState<AppDependency[]>([]);
  const [k8sNodes, setK8sNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedPod, setSelectedPod] = useState<ContainerInfo | null>(null);
  const [selectedK8sNode, setSelectedK8sNode] = useState<NodeInfo | null>(null);
  const [settingsMap, setSettingsMap] = useState<Map<string, AppSettings>>(new Map());
  const [isAdmin, setIsAdmin] = useState(false);
  const [overwatch, setOverwatch] = useState<OverwatchInsight | null>(null);
  const [overwatchLoading, setOverwatchLoading] = useState(false);
  const [showOverwatch, setShowOverwatch] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    setSettingsMap(loadSettings());
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setIsAdmin(d.isAdmin === true)).catch(() => {});
  }, []);

  const fetchOverwatch = useCallback(async () => {
    setOverwatchLoading(true);
    try {
      const data = await topologyApi.getOverwatchInsights();
      setOverwatch(data);
    } catch { /* service may not be up yet */ } finally {
      setOverwatchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverwatch();
    const id = setInterval(fetchOverwatch, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchOverwatch]);

  // Inject anomaly highlights into app nodes whenever overwatch data updates
  useEffect(() => {
    const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const anomalyMap = new Map<string, 'low' | 'medium' | 'high'>();

    for (const anomaly of (overwatch?.anomalies ?? [])) {
      const affected = anomaly.affected.toLowerCase();
      // We'll resolve node IDs in the setNodes callback below
      anomalyMap.set(affected, anomaly.severity as 'low' | 'medium' | 'high');
    }

    setNodes((prev) => prev.map((n) => {
      if (n.type !== 'appGroupNode') return n;
      const nodeId = n.id.toLowerCase(); // "namespace/appname"
      const app = nodeId.split('/')[1] ?? nodeId;
      let best: 'low' | 'medium' | 'high' | null = null;
      for (const [affected, severity] of anomalyMap) {
        const matches = nodeId === affected || app === affected ||
          affected.includes(app) || affected.includes(nodeId);
        if (matches && (!best || severityRank[severity] > severityRank[best])) {
          best = severity;
        }
      }
      return { ...n, data: { ...n.data, anomalyLevel: best } };
    }));
  }, [overwatch, setNodes]);

  // Fetch containers, dependencies, and nodes on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [containers, dependencies, nodeList] = await Promise.all([
          topologyApi.discoverContainers().catch(() => [] as ContainerInfo[]),
          topologyApi.getDependencies().catch(() => [] as AppDependency[]),
          topologyApi.getNodes().catch(() => [] as NodeInfo[]),
        ]);
        if (cancelled) return;
        setLiveContainers(containers);
        setDeps(dependencies);
        setK8sNodes(nodeList);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleK8sNodeClick = useCallback((node: NodeInfo) => {
    setSelectedGroupId(null);
    setSelectedPod(null);
    setSelectedK8sNode((prev) => (prev?.name === node.name ? null : node));
  }, []);

  // Build flow once when data arrives
  useEffect(() => {
    if (initializedRef.current || liveContainers.length === 0) return;
    initializedRef.current = true;
    const groups = applySettings(groupContainersToApps(liveContainers), settingsMap);
    const { nodes: flowNodes, edges: flowEdges } = buildFlow(groups, deps, k8sNodes);
    // Inject callback directly so it's available from the first render
    setNodes(flowNodes.map((n) =>
      n.type === 'proxmoxHostNode' ? { ...n, data: { ...n.data, onNodeClick: handleK8sNodeClick } } : n
    ));
    onEdgesChange(flowEdges.map((e) => ({ type: 'add' as const, item: e })));
  }, [liveContainers, deps, k8sNodes, settingsMap, setNodes, onEdgesChange, handleK8sNodeClick]);

  // Poll pod states
  useEffect(() => {
    if (loading) return;
    const id = setInterval(async () => {
      try {
        const containers = await topologyApi.discoverContainers();
        setLiveContainers(containers);
        const groupMap = new Map(groupContainersToApps(containers).map((g) => [g.id, g]));
        const podMap = new Map(containers.map((c) => [`pod__${c.id}`, c]));
        setNodes((prev) => prev.map((n) => {
          if (n.type === 'appGroupNode') {
            const g = groupMap.get(n.id);
            return g ? { ...n, data: { ...n.data, pods: g.pods } } : n;
          }
          if (n.type === 'podNode') {
            const pod = podMap.get(n.id);
            return pod ? { ...n, data: { pod } } : n;
          }
          return n;
        }));
      } catch { /* ignore */ }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [loading, setNodes]);

  // Sync selected state to nodes
  useEffect(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, selected: n.id === selectedGroupId } })));
  }, [selectedGroupId, setNodes]);

  useEffect(() => {
    setNodes((prev) => prev.map((n) => {
      if (n.type !== 'proxmoxHostNode') return n;
      return { ...n, data: { ...n.data, onNodeClick: handleK8sNodeClick, selectedNodeName: selectedK8sNode?.name ?? null } };
    }));
  }, [selectedK8sNode, handleK8sNodeClick, setNodes]);

  const appGroups = useMemo(() => applySettings(groupContainersToApps(liveContainers), settingsMap), [liveContainers, settingsMap]);
  const selectedGroup = selectedGroupId ? appGroups.find((g) => g.id === selectedGroupId) ?? null : null;

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'appGroupNode') {
      setSelectedPod(null);
      setSelectedK8sNode(null);
      setSelectedGroupId((prev) => (prev === node.id ? null : node.id));
    } else if (node.type === 'podNode') {
      setSelectedGroupId(null);
      setSelectedK8sNode(null);
      setSelectedPod((node.data as PodNodeData).pod);
    }
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-muted-foreground text-sm">{t('loading')}</div></div>;
  }
  if (liveContainers.length === 0) {
    return <div className="flex items-center justify-center h-full"><div className="text-muted-foreground text-sm">{t('noTopology')}</div></div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => { setSelectedGroupId(null); setSelectedPod(null); setSelectedK8sNode(null); }}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ maxZoom: 0.9, padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1} maxZoom={1.5}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={true}
          elevateEdgesOnSelect={false}
          panOnDrag zoomOnScroll
          style={{ background: 'transparent' }}
        >
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-xl border bg-background/90 backdrop-blur-sm shadow-lg p-1.5">
            <Button onClick={() => zoomIn()} size="icon" variant="ghost" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
            <Button onClick={() => zoomOut()} size="icon" variant="ghost" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={() => fitView({ maxZoom: 0.9, padding: 0.15 })} size="icon" variant="ghost" className="h-8 w-8"><Maximize className="h-4 w-4" /></Button>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowOverwatch((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
                showOverwatch
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-background/80 border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Insights</span>
              {overwatch && overwatch.status !== 'pending' && (
                <span className={`h-1.5 w-1.5 rounded-full ${
                  overwatch.status === 'healthy' ? 'bg-emerald-400' :
                  overwatch.status === 'warning' ? 'bg-amber-400' :
                  overwatch.status === 'critical' ? 'bg-red-400' : 'bg-zinc-400'
                }`} />
              )}
            </button>
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-background/80 backdrop-blur border border-border/60 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2 whitespace-nowrap">
              <ServerIcon className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold">Kubernetes</p>
              <p className="hidden sm:block text-[10px] text-muted-foreground">Cluster Provisioned With Argo</p>
              <Badge variant="outline" className="text-[10px]">PROXMOX</Badge>
            </div>
          </div>
        </ReactFlow>
      </div>

      {showOverwatch && !selectedGroup && !selectedPod && !selectedK8sNode && (
        <OverwatchPanel
          insight={overwatch}
          loading={overwatchLoading}
          onClose={() => setShowOverwatch(false)}
          onRefresh={fetchOverwatch}
        />
      )}

      {selectedGroup && (
        <AppGroupPanel
          key={selectedGroup.id}
          group={selectedGroup}
          onClose={() => setSelectedGroupId(null)}
          t={(key) => t(key)}
          showLogs={isAdmin || settingsMap.get(selectedGroup.id)?.showLogs !== false}
        />
      )}

      {selectedPod && !selectedGroup && (
        <div className="w-full md:w-[48%] shrink-0 border-l border-white/10 bg-background/80 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
          <PodDetailPanel
            pod={selectedPod}
            onBack={() => setSelectedPod(null)}
            showLogs={settingsMap.get(`${selectedPod.networks[0] || 'default'}/${selectedPod.appName || deriveAppName(selectedPod.name)}`)?.showLogs !== false}
            t={(key) => t(key)}
          />
        </div>
      )}

      {selectedK8sNode && (
        <div className="w-full md:w-[48%] shrink-0 border-l border-white/10 bg-background/80 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
          <NodeDetailPanel
            node={selectedK8sNode}
            onClose={() => setSelectedK8sNode(null)}
            t={(key) => t(key)}
          />
        </div>
      )}
    </div>
  );
}

function applySettings(groups: AppGroup[], settings: Map<string, AppSettings>): AppGroup[] {
  if (settings.size === 0) return groups;
  return groups
    .filter((g) => settings.get(g.id)?.visible !== false)
    .map((g) => {
      const s = settings.get(g.id);
      return s?.displayName ? { ...g, appName: s.displayName } : g;
    });
}

export default function HomelabPage() {
  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <AnimatedBackground />
      <ReactFlowProvider>
        <TopologyCanvas />
      </ReactFlowProvider>
    </div>
  );
}
