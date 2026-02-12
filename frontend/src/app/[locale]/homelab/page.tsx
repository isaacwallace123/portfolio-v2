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
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ZoomIn, ZoomOut, Maximize, Server as ServerIcon,
  Cpu, MemoryStick, HardDrive, Clock, X,
} from 'lucide-react';
import { ContainerNode, type ContainerNodeData } from '@/features/topology/ui/ContainerNode';
import { InfrastructureNode, type InfrastructureNodeData } from '@/features/topology/ui/InfrastructureNode';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { getLogLineClassName, splitTimestamp, detectLogLevel } from '@/features/topology/lib/logColorizer';
import type { Server, TopologyNode, TopologyConnection, ContainerInfo, ContainerStats, NodeMetrics } from '@/features/topology/lib/types';
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

// --- Detail Panel (60% width, with Metrics/Logs tabs) ---

function DetailPanel({
  container,
  onClose,
  t,
}: {
  container: ContainerInfo;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [statsHistory, setStatsHistory] = useState<MetricSnapshot[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('5m');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStats(null);
    setLogs([]);
    setStatsHistory([]);
    setLogsLoading(true);

    async function load() {
      const [statsData, logsData, metricsData] = await Promise.all([
        topologyApi.getContainerStats(container.name).catch(() => null),
        topologyApi.getContainerLogs(container.name, 80).catch(() => null),
        topologyApi.getNodeMetrics().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setStatsHistory([{ time: now, cpu: statsData.cpuPercent, memory: statsData.memoryPercent }]);
      }
      if (logsData) setLogs(logsData.lines);
      if (metricsData) setNodeMetrics(metricsData);
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
  }, [container.name]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const maxPoints = TIME_RANGES.find((r) => r.value === timeRange)?.points ?? 60;
  const visibleHistory = statsHistory.length > maxPoints ? statsHistory.slice(-maxPoints) : statsHistory;

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
            <TabsTrigger value="logs">{t('recentLogs')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="flex-1 overflow-y-auto m-0">
          <div className="p-5 space-y-5">
            {/* Live gauges */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground text-center py-4">{t('loadingStats')}</p>
            )}

            {/* Time range selector + charts */}
            {visibleHistory.length > 1 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">CPU Usage</p>
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
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibleHistory}>
                          <defs>
                            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                          <Area type="monotone" dataKey="cpu" stroke="hsl(var(--chart-1))" fill="url(#cpuGradient)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs font-medium text-muted-foreground">Memory Usage</p>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibleHistory}>
                          <defs>
                            <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                          <Area type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" fill="url(#memGradient)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Host metrics */}
            {nodeMetrics && (nodeMetrics.cpu !== null || nodeMetrics.memory !== null) && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-3">{t('hostMetrics')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {nodeMetrics.cpu !== null && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{t('hostCpu')}</span>
                          <span className="font-medium">{nodeMetrics.cpu.toFixed(1)}%</span>
                        </div>
                        <Progress value={nodeMetrics.cpu} className="h-1" />
                      </div>
                    )}
                    {nodeMetrics.memory !== null && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{t('hostMemory')}</span>
                          <span className="font-medium">{nodeMetrics.memory.toFixed(1)}%</span>
                        </div>
                        <Progress value={nodeMetrics.memory} className="h-1" />
                      </div>
                    )}
                    {nodeMetrics.disk !== null && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{t('hostDisk')}</span>
                          <span className="font-medium">{nodeMetrics.disk.toFixed(1)}%</span>
                        </div>
                        <Progress value={nodeMetrics.disk} className="h-1" />
                      </div>
                    )}
                    {nodeMetrics.uptime !== null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t('uptime')}
                        </span>
                        <span className="font-medium">{formatUptime(nodeMetrics.uptime)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Logs Tab */}
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
      </Tabs>
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
  const initializedRef = useRef(false);

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
    if (node.type === 'infrastructureNode') return;
    setSelectedContainerName((prev) => (prev === node.id ? null : node.id));
  }, []);

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
          onPaneClick={() => setSelectedContainerName(null)}
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-background/80 backdrop-blur border border-border/60 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
                <ServerIcon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{servers[0].name}</p>
                  {servers[0].description && (
                    <p className="text-[10px] text-muted-foreground">{servers[0].description}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] ml-2">{servers[0].type}</Badge>
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
          t={(key: string) => t(key)}
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
