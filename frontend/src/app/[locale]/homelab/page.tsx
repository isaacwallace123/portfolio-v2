'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ZoomIn, ZoomOut, Maximize, Server as ServerIcon,
  Cpu, MemoryStick, Clock, X, PowerOff, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { AppGroupNode, type AppGroupNodeData } from '@/features/topology/ui/AppGroupNode';
import { NamespaceGroupNode } from '@/features/topology/ui/NamespaceGroupNode';
import { InfrastructureNode, type InfrastructureNodeData } from '@/features/topology/ui/InfrastructureNode';
import { PodNode, type PodNodeData } from '@/features/topology/ui/PodNode';
import { ProxmoxHostNode, type ProxmoxHostNodeData } from '@/features/topology/ui/ProxmoxHostNode';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { detectIconFromContainer } from '@/features/topology/lib/iconMap';
import { getLogLineClassName, splitTimestamp, detectLogLevel } from '@/features/topology/lib/logColorizer';
import type { ContainerInfo, ContainerStats, MetricsRange, AppDependency, NodeInfo } from '@/features/topology/lib/types';
import { useTranslations } from 'next-intl';

const nodeTypes: NodeTypes = {
  appGroupNode: AppGroupNode,
  namespaceGroupNode: NamespaceGroupNode,
  infrastructureNode: InfrastructureNode,
  podNode: PodNode,
  proxmoxHostNode: ProxmoxHostNode,
};

const POLL_INTERVAL = 10_000;
const NS_ORDER = ['portfolio', 'networking', 'monitoring', 'media', 'argocd', 'secrets'];

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
  pod, onBack, showLogs, t,
}: {
  pod: ContainerInfo; onBack: () => void; showLogs: boolean; t: (key: string) => string;
}) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0">
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold truncate">{pod.appName || pod.name}</p>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${
              pod.state === 'running' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'
            }`}>{pod.state}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{pod.name}</p>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 border-b border-border/40 shrink-0">
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
                    <Card><CardContent className="pt-3 pb-2.5">
                      <div className="flex items-center gap-1.5 mb-1"><Cpu className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">CPU</span></div>
                      <p className="text-base font-bold">{stats.cpuPercent.toFixed(1)}%</p>
                      <Progress value={Math.min(stats.cpuPercent, 100)} className="h-1 mt-1.5" />
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-2.5">
                      <div className="flex items-center gap-1.5 mb-1"><MemoryStick className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Mem</span></div>
                      <p className="text-base font-bold">{formatBytes(stats.memoryUsage)}</p>
                      <Progress value={Math.min(stats.memoryPercent, 100)} className="h-1 mt-1.5" />
                    </CardContent></Card>
                    <Card><CardContent className="pt-3 pb-2.5">
                      <div className="flex items-center gap-1.5 mb-1"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Status</span></div>
                      <p className="text-base font-bold capitalize">{pod.state}</p>
                    </CardContent></Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <Card key={i}><CardContent className="pt-3 pb-2.5">
                        <Skeleton className="h-3 w-10 mb-1.5" /><Skeleton className="h-5 w-14 mt-1" /><Skeleton className="h-1 mt-1.5" />
                      </CardContent></Card>
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
                  <Card><CardContent className="pt-3 pb-2.5"><Skeleton className="h-28 w-full rounded" /></CardContent></Card>
                ) : chartData === null ? (
                  <Card><CardContent className="pt-3 pb-2.5 flex items-center justify-center h-28">
                    <p className="text-xs text-muted-foreground">Collecting metrics…</p>
                  </CardContent></Card>
                ) : (
                  <Card><CardContent className="pt-3 pb-2.5"><div className="h-28">
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
                  </div></CardContent></Card>
                )}

                <p className="text-[11px] font-medium text-muted-foreground">Memory (MB)</p>
                {prometheusRange === null ? (
                  <Card><CardContent className="pt-3 pb-2.5"><Skeleton className="h-28 w-full rounded" /></CardContent></Card>
                ) : chartData === null ? (
                  <Card><CardContent className="pt-3 pb-2.5 flex items-center justify-center h-28">
                    <p className="text-xs text-muted-foreground">Collecting metrics…</p>
                  </CardContent></Card>
                ) : (
                  <Card><CardContent className="pt-3 pb-2.5"><div className="h-28">
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
                  </div></CardContent></Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {showLogs && (
          <TabsContent value="logs" className="flex-1 m-0 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto bg-black/40 font-mono text-[11px] leading-relaxed p-3">
              {logsLoading ? (
                <p className="text-muted-foreground text-center py-8">{t('loadingLogs')}</p>
              ) : logs.length > 0 ? (
                logs.map((line, i) => {
                  const { timestamp, rest } = splitTimestamp(line);
                  const colorClass = getLogLineClassName(line);
                  const level = detectLogLevel(line);
                  return (
                    <div key={i} className="flex items-start gap-2 py-px hover:bg-white/5 px-1 rounded">
                      {timestamp && <span className="text-[10px] text-gray-600 shrink-0 tabular-nums">{timestamp}</span>}
                      {level && <span className={`shrink-0 text-[9px] font-bold px-1 rounded ${level.badgeClass}`}>{level.badge}</span>}
                      <span className={`${colorClass} whitespace-pre-wrap break-all`}>{rest}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('noLogs')}</p>
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
  const [selectedPod, setSelectedPod] = useState<ContainerInfo | null>(
    activePods.length === 1 ? activePods[0] : null,
  );

  if (selectedPod) {
    return (
      <div className="w-full md:w-[48%] shrink-0 border-l border-border/40 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
        <PodDetailPanel pod={selectedPod} onBack={() => setSelectedPod(null)} showLogs={showLogs} t={t} />
      </div>
    );
  }

  const running = activePods.filter((p) => p.state === 'running').length;

  return (
    <div className="w-full md:w-[48%] shrink-0 border-l border-border/40 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-2.5">
          <h3 className="text-sm font-semibold truncate">{group.appName}</h3>
          <Badge variant="outline" className="text-[10px] shrink-0">{group.namespace}</Badge>
          <span className="text-[10px] text-muted-foreground shrink-0">{running}/{activePods.length} running</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1.5">
          {activePods.map((pod) => (
            <button key={pod.id} onClick={() => setSelectedPod(pod)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/20 transition-all text-left group"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                pod.state === 'running' ? 'bg-green-500' : pod.state === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{pod.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{pod.state} · {pod.image?.split('/').pop()?.split(':')[0] ?? ''}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
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
      style: { stroke: 'hsl(var(--border))', strokeWidth: 1.5, ...(dashed ? { strokeDasharray: '5 4', opacity: 0.5 } : {}) },
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
  const canvasW = Math.max(totalGridW, gwTierW, proxmoxW, 500);
  const centerX = canvasW / 2;

  // 1. Infrastructure chain: Internet → Router → ProxmoxHost
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

  flowNodes.push({
    id: '__proxmox', type: 'proxmoxHostNode',
    position: { x: centerX - proxmoxW / 2, y: yOffset },
    draggable: false, selectable: false,
    data: { k8sNodes } satisfies ProxmoxHostNodeData,
  });
  addEdge('__router', '__proxmox');
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
        addEdge('__proxmox', g.id);
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
        addEdge(srcId, tgtId);
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
        addEdge(srcId, tgtId);
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
      // Namespace box → networking tier app (above): exit from top, enter app from bottom
      srcHandle = 'source-top';
      tgtHandle = 'target-bottom'; // uses the named target-bottom handle on AppGroupNode
    } else if (tgtNode.startsWith('ns__')) {
      // Networking tier app → namespace box (below): exit from bottom, enter box from top
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
  const [settingsMap, setSettingsMap] = useState<Map<string, AppSettings>>(new Map());
  const [isAdmin, setIsAdmin] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    setSettingsMap(loadSettings());
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setIsAdmin(d.isAdmin === true)).catch(() => {});
  }, []);

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

  // Build flow once when data arrives
  useEffect(() => {
    if (initializedRef.current || liveContainers.length === 0) return;
    initializedRef.current = true;
    const groups = applySettings(groupContainersToApps(liveContainers), settingsMap);
    const { nodes: flowNodes, edges: flowEdges } = buildFlow(groups, deps, k8sNodes);
    setNodes(flowNodes);
    onEdgesChange(flowEdges.map((e) => ({ type: 'add' as const, item: e })));
  }, [liveContainers, deps, k8sNodes, settingsMap, setNodes, onEdgesChange]);

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

  const appGroups = useMemo(() => applySettings(groupContainersToApps(liveContainers), settingsMap), [liveContainers, settingsMap]);
  const selectedGroup = selectedGroupId ? appGroups.find((g) => g.id === selectedGroupId) ?? null : null;

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'appGroupNode') {
      setSelectedPod(null);
      setSelectedGroupId((prev) => (prev === node.id ? null : node.id));
    } else if (node.type === 'podNode') {
      setSelectedGroupId(null);
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
          onPaneClick={() => { setSelectedGroupId(null); setSelectedPod(null); }}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ maxZoom: 0.9, padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1} maxZoom={1.5}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={true}
          elevateEdgesOnSelect={false}
          panOnDrag zoomOnScroll
        >
          <Background />

          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-xl border bg-background/90 backdrop-blur-sm shadow-lg p-1.5">
            <Button onClick={() => zoomIn()} size="icon" variant="ghost" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
            <Button onClick={() => zoomOut()} size="icon" variant="ghost" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
            <Button onClick={() => fitView({ maxZoom: 0.9, padding: 0.15 })} size="icon" variant="ghost" className="h-8 w-8"><Maximize className="h-4 w-4" /></Button>
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
        <div className="w-full md:w-[48%] shrink-0 border-l border-border/40 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
          <PodDetailPanel
            pod={selectedPod}
            onBack={() => setSelectedPod(null)}
            showLogs={settingsMap.get(`${selectedPod.networks[0] || 'default'}/${selectedPod.appName || deriveAppName(selectedPod.name)}`)?.showLogs !== false}
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
    <div className="h-[calc(100vh-4rem)]">
      <ReactFlowProvider>
        <TopologyCanvas />
      </ReactFlowProvider>
    </div>
  );
}
