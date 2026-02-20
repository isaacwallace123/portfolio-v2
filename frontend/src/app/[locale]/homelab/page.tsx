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
  Cpu, MemoryStick, HardDrive, Clock, X,
} from 'lucide-react';
import { ContainerNode, type ContainerNodeData } from '@/features/topology/ui/ContainerNode';
import { InfrastructureNode, type InfrastructureNodeData } from '@/features/topology/ui/InfrastructureNode';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { getLogLineClassName, splitTimestamp, detectLogLevel } from '@/features/topology/lib/logColorizer';
import type { Server, TopologyNode, TopologyConnection, ContainerInfo, ContainerStats, NodeMetrics, SystemInfo, MetricsRange } from '@/features/topology/lib/types';
import { useTranslations } from 'next-intl';

const nodeTypes: NodeTypes = {
  containerNode: ContainerNode,
  infrastructureNode: InfrastructureNode,
};

// --- Types ---

type MetricSnapshot = {
  time: string;
  cpu: number;
  memory: number;
};

const POLL_INTERVAL = 5000;
const MAX_HISTORY = 720; // ~1h of data at 5s intervals

type TimeRange = '5m' | '15m' | '1h' | '24h';
const TIME_RANGES: { label: string; value: TimeRange; points: number }[] = [
  { label: '5m', value: '5m', points: 60 },
  { label: '15m', value: '15m', points: 180 },
  { label: '1h', value: '1h', points: 720 },
  { label: '24h', value: '24h', points: MAX_HISTORY },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatRate(bytesPerSec: number | null): string {
  if (bytesPerSec === null) return 'N/A';
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  if (bytesPerSec < 1024 * 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  return `${(bytesPerSec / 1024 / 1024 / 1024).toFixed(1)} GB/s`;
}

// --- Chart Tooltip ---

function ChartTooltip({ active, payload, label, unit = '%' }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 shadow-md text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold tabular-nums">{payload[0].value.toFixed(1)}{unit}</p>
    </div>
  );
}

// --- Detail Panel (60% width, with Metrics/Logs tabs) ---

function DetailPanel({
  container,
  onClose,
  showLogs,
  t,
  initialHistory,
  onHistoryUpdate,
}: {
  container: ContainerInfo;
  onClose: () => void;
  showLogs: boolean;
  t: (key: string) => string;
  initialHistory: MetricSnapshot[];
  onHistoryUpdate: (name: string, history: MetricSnapshot[]) => void;
}) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  // Initialise from parent cache so history survives panel close/reopen
  const [statsHistory, setStatsHistory] = useState<MetricSnapshot[]>(initialHistory);
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');
  const [prometheusRange, setPrometheusRange] = useState<MetricsRange | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a stable ref to the callback to avoid re-creating effects
  const onHistoryUpdateRef = useRef(onHistoryUpdate);
  onHistoryUpdateRef.current = onHistoryUpdate;

  // Persist statsHistory back to parent cache whenever it changes
  useEffect(() => {
    if (statsHistory.length > 0) {
      onHistoryUpdateRef.current(container.name, statsHistory);
    }
  }, [statsHistory, container.name]);

  useEffect(() => {
    setStats(null);
    setLogs([]);
    // Restore from parent cache when container changes (initialHistory already
    // reflects the new container's cached data at this point)
    setStatsHistory(initialHistory);
    setPrometheusRange(null);
    setLogsLoading(true);

    async function load() {
      const [statsData, logsData] = await Promise.all([
        topologyApi.getContainerStats(container.name).catch(() => null),
        showLogs ? topologyApi.getContainerLogs(container.name, 80).catch(() => null) : null,
      ]);

      if (statsData) {
        setStats(statsData);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Append to cached history instead of replacing it
        setStatsHistory((prev) => {
          const next = [...prev, { time: now, cpu: statsData.cpuPercent, memory: statsData.memoryPercent }];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      }
      if (logsData) setLogs(logsData.lines);
      setLogsLoading(false);
    }

    load();

    // Poll stats
    intervalRef.current = setInterval(async () => {
      try {
        const data = await topologyApi.getContainerStats(container.name);
        setStats(data);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setStatsHistory((prev) => {
          const next = [...prev, { time: now, cpu: data.cpuPercent, memory: data.memoryPercent }];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      } catch {
        // ignore
      }
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container.name]);

  // Fetch Prometheus range data on mount, on time-range change, and every 30s so
  // the chart auto-populates once cAdvisor data has been scraped.
  useEffect(() => {
    let cancelled = false;

    async function fetchRange() {
      try {
        const data = await topologyApi.getMetricsRange(timeRange, container.name);
        if (!cancelled) setPrometheusRange(data);
      } catch {
        if (!cancelled) setPrometheusRange(null);
      }
    }

    fetchRange();
    const id = setInterval(fetchRange, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [timeRange, container.name]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Prefer Prometheus historical data; fall back to live in-memory history.
  // Memory from Prometheus is raw bytes; divide by stats.memoryLimit (from
  // Docker stats API) to get %, which correctly reflects the cgroup limit
  // regardless of cAdvisor's container_spec_memory_limit_bytes reliability.
  const promChartData = prometheusRange && prometheusRange.cpu.length > 1
    ? prometheusRange.cpu.map((pt, i) => ({
        time: pt.time,
        cpu: pt.value,
        memory: stats?.memoryLimit
          ? Math.min((prometheusRange.memory[i]?.value ?? 0) / stats.memoryLimit * 100, 100)
          : 0,
      }))
    : null;

  const maxPoints = TIME_RANGES.find((r) => r.value === timeRange)?.points ?? 60;
  const visibleHistory = statsHistory.length > maxPoints ? statsHistory.slice(-maxPoints) : statsHistory;
  const chartData = promChartData ?? visibleHistory;

  const displayName = container.name.replace(/^portfolio_/, '');

  return (
    <div className="w-full md:w-[60%] shrink-0 border-l border-border/40 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                container.state === 'running'
                  ? 'bg-green-500/10 text-green-600 border-green-500/30'
                  : 'bg-red-500/10 text-red-600 border-red-500/30'
              }`}
            >
              {container.state}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{container.image}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <div className="px-5 pt-2 border-b border-border/40">
          <TabsList variant="line">
            <TabsTrigger value="metrics">{t('resources')}</TabsTrigger>
            {showLogs && <TabsTrigger value="logs">{t('recentLogs')}</TabsTrigger>}
          </TabsList>
        </div>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="flex-1 overflow-y-auto m-0">
          <div className="p-5 space-y-5">
            {/* Live gauges */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">CPU</span>
                    </div>
                    <p className="text-xl font-bold">{stats.cpuPercent.toFixed(1)}%</p>
                    <Progress value={Math.min(stats.cpuPercent, 100)} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t('memory')}</span>
                    </div>
                    <p className="text-xl font-bold">{formatBytes(stats.memoryUsage)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">of {formatBytes(stats.memoryLimit)}</p>
                    <Progress value={stats.memoryPercent} className="h-1.5 mt-1.5" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t('uptime')}</span>
                    </div>
                    <p className="text-xl font-bold">{container.status.replace(/^Up\s*/i, '')}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!stats && container.state === 'running' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-7 w-20 mt-1" />
                      <Skeleton className="h-1.5 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Time range selector + charts */}
            {(chartData.length > 1 || stats !== null || container.state === 'running') && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">CPU</p>
                  <div className="flex gap-1">
                    {TIME_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                          timeRange === range.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                {prometheusRange === null ? (
                  /* Skeleton charts while Prometheus data loads */
                  <>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <Skeleton className="h-36 w-full rounded-md" />
                      </CardContent>
                    </Card>
                    <p className="text-xs font-medium text-muted-foreground">Memory</p>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <Skeleton className="h-36 w-full rounded-md" />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                              <Area type="monotone" dataKey="cpu" stroke="hsl(var(--chart-1))" fill="url(#cpuGradient)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-xs font-medium text-muted-foreground">Memory</p>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                              <Area type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" fill="url(#memGradient)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}

          </div>
        </TabsContent>

        {/* Logs Tab */}
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
                    <div key={i} className="flex items-start gap-2 py-px hover:bg-white/5 px-2 rounded">
                      {timestamp && (
                        <span className="text-[10px] text-gray-600 shrink-0 tabular-nums">{timestamp}</span>
                      )}
                      {level && (
                        <span className={`shrink-0 text-[9px] font-bold px-1 rounded ${level.badgeClass}`}>
                          {level.badge}
                        </span>
                      )}
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

// --- Multi-line chart tooltip (for I/O charts with two series) ---

function MultiChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {formatRate(p.value)}
        </p>
      ))}
    </div>
  );
}

// --- Server Panel (admin-only, shown when a server infrastructure node is clicked) ---

function ServerPanel({ server, onClose }: { server: Server; onClose: () => void }) {
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [prometheusRange, setPrometheusRange] = useState<MetricsRange | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');

  // Poll live metrics every 10s
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [metrics, sysInfo] = await Promise.all([
        topologyApi.getNodeMetrics().catch(() => null),
        topologyApi.getSystemInfo().catch(() => null),
      ]);
      if (cancelled) return;
      if (metrics) setNodeMetrics(metrics as NodeMetrics);
      if (sysInfo) setSystemInfo(sysInfo as SystemInfo);
    }

    load();
    const id = setInterval(load, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Fetch Prometheus range data for host-level charts (containerName = '')
  useEffect(() => {
    let cancelled = false;

    async function fetchRange() {
      try {
        const data = await topologyApi.getMetricsRange(timeRange, '');
        if (!cancelled) setPrometheusRange(data);
      } catch {
        if (!cancelled) setPrometheusRange(null);
      }
    }

    fetchRange();
    const id = setInterval(fetchRange, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [timeRange]);

  // Build chart data arrays aligned by index
  const cpuChartData = prometheusRange?.cpu.map((pt, i) => ({
    time: pt.time,
    cpu: pt.value,
    memory: prometheusRange.memory[i]?.value ?? 0,
  })) ?? [];

  const networkChartData = prometheusRange?.networkRx.map((pt, i) => ({
    time: pt.time,
    rx: pt.value,
    tx: prometheusRange.networkTx[i]?.value ?? 0,
  })) ?? [];

  const diskIoChartData = prometheusRange?.diskRead.map((pt, i) => ({
    time: pt.time,
    read: pt.value,
    write: prometheusRange.diskWrite[i]?.value ?? 0,
  })) ?? [];

  const hasCharts = cpuChartData.length > 1;

  const displayIP = systemInfo?.publicIP || systemInfo?.ip || '';

  return (
    <div className="w-full md:w-[60%] shrink-0 border-l border-border/40 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ServerIcon className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold truncate">{server.name}</h3>
            <Badge variant="outline" className="text-[10px]">{server.type}</Badge>
          </div>
          {systemInfo && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {systemInfo.os} · {systemInfo.architecture} · {systemInfo.cpus} CPUs
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!nodeMetrics && !systemInfo && (
          <>
            {/* System info chip skeletons */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-3 pb-3">
                    <Skeleton className="h-2.5 w-14 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Live gauge skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-7 w-16 mt-1" />
                    <Skeleton className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-7 w-16 mt-1" />
                <Skeleton className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          </>
        )}

        {/* System info chips */}
        {systemInfo && (
          <div className="grid grid-cols-2 gap-3">
            {displayIP && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Public IP</p>
                  <p className="text-sm font-mono font-medium">{displayIP}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Docker</p>
                <p className="text-sm font-medium">v{systemInfo.dockerVersion}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Containers</p>
                <p className="text-sm font-medium">{systemInfo.running} running / {systemInfo.containers} total</p>
              </CardContent>
            </Card>
            {nodeMetrics?.uptime != null && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Uptime</p>
                  <p className="text-sm font-medium">{formatUptime(nodeMetrics.uptime)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Live gauges */}
        {nodeMetrics && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nodeMetrics.cpu !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">CPU</span>
                    </div>
                    <p className="text-xl font-bold">{Math.max(0, nodeMetrics.cpu).toFixed(1)}%</p>
                    <Progress value={Math.max(0, Math.min(nodeMetrics.cpu, 100))} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              )}
              {nodeMetrics.memory !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Memory</span>
                    </div>
                    <p className="text-xl font-bold">{nodeMetrics.memory.toFixed(1)}%</p>
                    {nodeMetrics.totalMemory != null && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">of {formatBytes(nodeMetrics.totalMemory)}</p>
                    )}
                    <Progress value={nodeMetrics.memory} className="h-1.5 mt-1.5" />
                  </CardContent>
                </Card>
              )}
            </div>

            {nodeMetrics.disk !== null && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Disk Usage</span>
                  </div>
                  <p className="text-xl font-bold">{nodeMetrics.disk.toFixed(1)}%</p>
                  <Progress value={nodeMetrics.disk} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            )}

          </>
        )}

        {/* Historical charts (Prometheus) */}
        {(hasCharts || nodeMetrics !== null) && (
          <>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-medium text-muted-foreground">Historical</p>
              <div className="flex gap-1">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                      timeRange === range.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart skeletons while Prometheus data is loading */}
            {!hasCharts && nodeMetrics !== null && (
              <div className="space-y-4">
                {['CPU', 'Memory', 'Network I/O', 'Disk I/O'].map((label) => (
                  <div key={label}>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <Skeleton className="h-36 w-full rounded-md" />
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* CPU chart */}
            {cpuChartData.length > 1 && (
              <>
                <p className="text-xs font-medium text-muted-foreground">CPU</p>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuChartData}>
                          <defs>
                            <linearGradient id="svCpuGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="cpu" stroke="hsl(var(--chart-1))" fill="url(#svCpuGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Memory chart */}
            {cpuChartData.length > 1 && (
              <>
                <p className="text-xs font-medium text-muted-foreground">Memory</p>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cpuChartData}>
                          <defs>
                            <linearGradient id="svMemGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" fill="url(#svMemGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Network I/O chart */}
            {networkChartData.length > 1 && (
              <>
                <p className="text-xs font-medium text-muted-foreground">Network I/O</p>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={networkChartData}>
                          <defs>
                            <linearGradient id="svNetRxGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="svNetTxGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatRate(v).replace('/s', '')} />
                          <Tooltip content={<MultiChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="rx" name="In" stroke="hsl(var(--chart-3))" fill="url(#svNetRxGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Area type="monotone" dataKey="tx" name="Out" stroke="hsl(var(--chart-4))" fill="url(#svNetTxGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Disk I/O chart */}
            {diskIoChartData.length > 1 && (
              <>
                <p className="text-xs font-medium text-muted-foreground">Disk I/O</p>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={diskIoChartData}>
                          <defs>
                            <linearGradient id="svDiskReadGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="svDiskWriteGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatRate(v).replace('/s', '')} />
                          <Tooltip content={<MultiChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="read" name="Read" stroke="hsl(var(--chart-5))" fill="url(#svDiskReadGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          <Area type="monotone" dataKey="write" name="Write" stroke="hsl(var(--chart-1))" fill="url(#svDiskWriteGrad)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Main Topology View ---

function TopologyCanvas() {
  const t = useTranslations('homelab');
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [servers, setServers] = useState<Server[]>([]);
  const [liveContainers, setLiveContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const [selectedContainerName, setSelectedContainerName] = useState<string | null>(null);
  const [selectedServerNode, setSelectedServerNode] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const initializedRef = useRef(false);
  // Persists live-polling history per container across panel close/reopen
  const statsHistoryCache = useRef<Map<string, MetricSnapshot[]>>(new Map());

  // Check admin status
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.isAdmin))
      .catch(() => {});
  }, []);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [topologyData, containers] = await Promise.all([
          topologyApi.getTopology(),
          topologyApi.discoverContainers().catch(() => [] as ContainerInfo[]),
        ]);
        if (cancelled) return;
        setServers(topologyData);
        setLiveContainers(containers);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const containerMap = useMemo(() => {
    const map = new Map<string, ContainerInfo>();
    for (const c of liveContainers) map.set(c.name, c);
    return map;
  }, [liveContainers]);

  const selectedContainer = selectedContainerName ? containerMap.get(selectedContainerName) ?? null : null;

  const showLogsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const server of servers) {
      for (const node of server.nodes) {
        map.set(node.containerName, node.showLogs);
      }
    }
    return map;
  }, [servers]);

  // Build flow
  useEffect(() => {
    if (initializedRef.current || servers.length === 0) return;
    initializedRef.current = true;

    const server = servers[0];
    const containerLookup = new Map<string, ContainerInfo>();
    for (const c of liveContainers) containerLookup.set(c.name, c);

    const flowNodes: Node[] = server.nodes.map((node: TopologyNode) => {
      const nodeKey = node.containerName;

      if (node.nodeType === 'infrastructure') {
        return {
          id: nodeKey,
          type: 'infrastructureNode',
          position: { x: node.positionX, y: node.positionY },
          draggable: false,
          data: {
            label: node.containerName,
            infrastructureType: node.infrastructureType || 'server',
          } satisfies InfrastructureNodeData,
        };
      }

      const live = containerLookup.get(nodeKey);
      return {
        id: nodeKey,
        type: 'containerNode',
        position: { x: node.positionX, y: node.positionY },
        draggable: false,
        data: {
          containerName: node.containerName,
          containerId: live?.id || node.containerId,
          icon: node.icon,
          state: live?.state,
          health: live?.health,
        } satisfies ContainerNodeData,
      };
    });

    const flowEdges: Edge[] = [];
    for (const node of server.nodes) {
      for (const conn of node.outgoing as TopologyConnection[]) {
        const targetNode = server.nodes.find((n: TopologyNode) => n.id === conn.targetId);
        if (targetNode) {
          flowEdges.push({
            id: conn.id,
            source: node.containerName,
            target: targetNode.containerName,
            label: conn.label || undefined,
            type: 'smoothstep',
            animated: conn.animated,
          });
        }
      }
    }

    setNodes(flowNodes);
    onEdgesChange(flowEdges.map((e) => ({ type: 'add' as const, item: e })));
  }, [servers, liveContainers, setNodes, onEdgesChange]);

  // Update selected state on nodes
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedContainerName },
      }))
    );
  }, [selectedContainerName, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'infrastructureNode') {
      if (isAdmin && node.data?.infrastructureType === 'server') {
        setSelectedServerNode((prev) => (prev === node.id ? null : node.id));
        setSelectedContainerName(null);
      }
      return;
    }
    setSelectedContainerName((prev) => (prev === node.id ? null : node.id));
    setSelectedServerNode(null);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">{t('loading')}</div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">{t('noTopology')}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => { setSelectedContainerName(null); setSelectedServerNode(null); }}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag
          zoomOnScroll
        >
          <Background />

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-xl border bg-background/90 backdrop-blur-sm shadow-lg p-1.5">
            <Button onClick={() => zoomIn()} size="icon" variant="ghost" className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={() => zoomOut()} size="icon" variant="ghost" className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={() => fitView()} size="icon" variant="ghost" className="h-8 w-8">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Server badge */}
          {servers.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100vw-2rem)]">
              <div className="bg-background/80 backdrop-blur border border-border/60 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2 whitespace-nowrap">
                <ServerIcon className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-semibold">{servers[0].name}</p>
                {servers[0].description && (
                  <p className="hidden sm:block text-[10px] text-muted-foreground">{servers[0].description}</p>
                )}
                <Badge variant="outline" className="text-[10px]">{servers[0].type}</Badge>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selectedContainer && (
        <DetailPanel
          container={selectedContainer}
          onClose={() => setSelectedContainerName(null)}
          showLogs={isAdmin || (showLogsMap.get(selectedContainerName!) ?? true)}
          t={(key: string) => t(key)}
          initialHistory={statsHistoryCache.current.get(selectedContainerName!) ?? []}
          onHistoryUpdate={(name, history) => statsHistoryCache.current.set(name, history)}
        />
      )}

      {/* Server panel (admin-only) */}
      {selectedServerNode && servers.length > 0 && (
        <ServerPanel
          server={servers[0]}
          onClose={() => setSelectedServerNode(null)}
        />
      )}
    </div>
  );
}

// --- Page ---

export default function HomelabPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ReactFlowProvider>
        <TopologyCanvas />
      </ReactFlowProvider>
    </div>
  );
}
