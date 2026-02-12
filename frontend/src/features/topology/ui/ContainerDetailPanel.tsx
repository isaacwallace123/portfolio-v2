'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Activity, HardDrive, Cpu, MemoryStick, Clock, RefreshCw } from 'lucide-react';
import { topologyApi } from '../api/topologyApi';
import { getLogLineClassName, splitTimestamp, detectLogLevel } from '../lib/logColorizer';
import type { ContainerInfo, ContainerStats, NodeMetrics } from '../lib/types';

interface ContainerDetailPanelProps {
  container: ContainerInfo | null;
  onClose: () => void;
  t: (key: string) => string;
}

const stateVariants: Record<string, string> = {
  running: 'bg-green-500/10 text-green-600 border-green-500/30',
  exited: 'bg-red-500/10 text-red-600 border-red-500/30',
  restarting: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  paused: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  created: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
  dead: 'bg-red-700/10 text-red-700 border-red-700/30',
};

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

export function ContainerDetailPanel({ container, onClose, t }: ContainerDetailPanelProps) {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use container name for API calls (stable across restarts)
  const fetchStats = useCallback(async (name: string) => {
    try {
      const data = await topologyApi.getContainerStats(name);
      setStats(data);
    } catch {
      // Stats unavailable (container may be stopped)
    }
  }, []);

  const fetchLogs = useCallback(async (name: string) => {
    try {
      const data = await topologyApi.getContainerLogs(name, 50);
      setLogs(data.lines);
    } catch {
      // Logs unavailable
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await topologyApi.getNodeMetrics();
      setNodeMetrics(data);
    } catch {
      // Metrics unavailable (Prometheus may not be configured)
    }
  }, []);

  // Fetch data when container changes — use container.name
  useEffect(() => {
    if (!container) return;

    setStats(null);
    setLogs([]);
    setStatsLoading(true);
    setLogsLoading(true);

    Promise.all([
      fetchStats(container.name),
      fetchLogs(container.name),
      fetchMetrics(),
    ]).finally(() => {
      setStatsLoading(false);
      setLogsLoading(false);
    });

    // Poll stats every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchStats(container.name);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [container, fetchStats, fetchLogs, fetchMetrics]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!container) return null;

  const stateClass = stateVariants[container.state] || stateVariants.created;

  return (
    <div className="w-full md:w-120 shrink-0 border-l border-border/40 bg-background/95 backdrop-blur flex flex-col overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate">{container.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{container.image}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${stateClass}`}>
              {container.state}
            </Badge>
            {container.health && container.health !== 'none' && (
              <Badge variant="outline" className="text-xs">
                {container.health}
              </Badge>
            )}
          </div>

          {/* Container Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                {t('containerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('status')}</span>
                <span className="font-medium">{container.status}</span>
              </div>
              {container.ports.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('ports')}</span>
                  <span className="font-medium text-right">
                    {container.ports
                      .filter((p) => p.publicPort)
                      .map((p) => `${p.publicPort}:${p.privatePort}`)
                      .join(', ') || 'None exposed'}
                  </span>
                </div>
              )}
              {container.networks.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('networks')}</span>
                  <span className="font-medium">{container.networks.join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CPU & Memory Stats */}
          {container.state === 'running' && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  {t('resources')}
                  {statsLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin ml-auto text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Cpu className="h-3 w-3" /> CPU
                        </span>
                        <span className="font-medium">{stats.cpuPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(stats.cpuPercent, 100)} className="h-1.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" /> {t('memory')}
                        </span>
                        <span className="font-medium">
                          {formatBytes(stats.memoryUsage)} / {formatBytes(stats.memoryLimit)}
                        </span>
                      </div>
                      <Progress value={stats.memoryPercent} className="h-1.5" />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('loadingStats')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Node Metrics (Prometheus) */}
          {nodeMetrics && (nodeMetrics.cpu !== null || nodeMetrics.memory !== null) && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  {t('hostMetrics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nodeMetrics.cpu !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('hostCpu')}</span>
                      <span className="font-medium">{nodeMetrics.cpu.toFixed(1)}%</span>
                    </div>
                    <Progress value={nodeMetrics.cpu} className="h-1.5" />
                  </div>
                )}
                {nodeMetrics.memory !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('hostMemory')}</span>
                      <span className="font-medium">{nodeMetrics.memory.toFixed(1)}%</span>
                    </div>
                    <Progress value={nodeMetrics.memory} className="h-1.5" />
                  </div>
                )}
                {nodeMetrics.disk !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('hostDisk')}</span>
                      <span className="font-medium">{nodeMetrics.disk.toFixed(1)}%</span>
                    </div>
                    <Progress value={nodeMetrics.disk} className="h-1.5" />
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
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {container.state === 'running' && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider">{t('recentLogs')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/30 rounded-md p-2 max-h-64 overflow-y-auto font-mono text-[10px] leading-relaxed">
                  {logsLoading ? (
                    <p className="text-muted-foreground text-center py-4">{t('loadingLogs')}</p>
                  ) : logs.length > 0 ? (
                    logs.map((line, i) => {
                      const { timestamp, rest } = splitTimestamp(line);
                      const colorClass = getLogLineClassName(line);
                      const level = detectLogLevel(line);
                      return (
                        <div key={i} className="whitespace-pre-wrap break-all hover:bg-white/5 px-1 rounded flex items-start gap-1.5">
                          {timestamp && (
                            <span className="text-gray-500 shrink-0">{timestamp}</span>
                          )}
                          {level && (
                            <span className={`shrink-0 text-[9px] font-semibold px-1 rounded border ${level.badgeClass}`}>
                              {level.badge}
                            </span>
                          )}
                          <span className={`${colorClass} flex-1`}>{rest}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t('noLogs')}</p>
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
