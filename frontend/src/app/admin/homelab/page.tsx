'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { detectIconFromContainer } from '@/features/topology/lib/iconMap';
import { IconPicker } from '@/features/topology/ui/IconPicker';
import type { ContainerInfo } from '@/features/topology/lib/types';
import { toast } from 'sonner';
import { RefreshCw, Save } from 'lucide-react';

const SETTINGS_KEY = 'homelab_app_settings';
type AppSettings = { visible: boolean; showLogs: boolean; displayName: string; icon?: string };
type GroupKey = string; // `${namespace}/${appName}`

function loadSettings(): Map<GroupKey, AppSettings> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [GroupKey, AppSettings][]);
  } catch { return new Map(); }
}

function persistSettings(map: Map<GroupKey, AppSettings>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(Array.from(map.entries())));
  }
}

interface AppGroup {
  key: GroupKey;
  appName: string;
  namespace: string;
  pods: ContainerInfo[];
  icon: string | null;
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

function buildGroups(containers: ContainerInfo[]): AppGroup[] {
  const map = new Map<GroupKey, AppGroup>();
  for (const c of containers) {
    const ns = c.networks[0] || 'default';
    const app = c.appName || deriveAppName(c.name);
    const key = `${ns}/${app}`;
    if (!map.has(key)) {
      map.set(key, { key, appName: app, namespace: ns, pods: [], icon: detectIconFromContainer(c.image || '', app) });
    }
    map.get(key)!.pods.push(c);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.namespace !== b.namespace ? a.namespace.localeCompare(b.namespace) : a.appName.localeCompare(b.appName)
  );
}

const NS_ORDER = ['portfolio', 'networking', 'monitoring', 'media', 'argocd', 'secrets'];

export default function AdminHomelabPage() {
  const [groups, setGroups] = useState<AppGroup[]>([]);
  const [settings, setSettings] = useState<Map<GroupKey, AppSettings>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const containers = await topologyApi.discoverContainers();
      setGroups(buildGroups(containers));
      setSettings(loadSettings());
      setDirty(false);
    } catch {
      toast.error('Failed to load containers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getSettings = (key: GroupKey): AppSettings =>
    settings.get(key) ?? { visible: true, showLogs: true, displayName: '' };

  const updateSetting = (key: GroupKey, patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = new Map(prev);
      next.set(key, { ...getSettings(key), ...patch });
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    persistSettings(settings);
    setDirty(false);
    toast.success('Settings saved');
  };

  const namespaces = [...new Set(groups.map((g) => g.namespace))].sort((a, b) => {
    const ai = NS_ORDER.indexOf(a), bi = NS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">Homelab Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure visibility and log access per service.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Column headers */}
      {!loading && groups.length > 0 && (
        <div className="flex items-center gap-4 px-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="w-8 shrink-0" />
          <div className="flex-1">Service</div>
          <div className="w-36 shrink-0 text-center">Display Name</div>
          <div className="w-16 shrink-0 text-center">Visible</div>
          <div className="w-12 shrink-0 text-center">Logs</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No containers discovered. Make sure the infra agent is running.
        </div>
      ) : (
        namespaces.map((ns) => {
          const nsGroups = groups.filter((g) => g.namespace === ns);
          return (
            <div key={ns}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{ns}</span>
                <Badge variant="outline" className="text-[10px]">{nsGroups.length} apps</Badge>
              </div>
              <div className="space-y-1.5">
                {nsGroups.map((group) => {
                  const s = getSettings(group.key);
                  return (
                    <div
                      key={group.key}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-lg border transition-colors backdrop-blur ${
                        s.visible ? 'border-border/50 bg-background/80 dark:bg-background/60' : 'border-border/30 bg-muted/20 opacity-60'
                      }`}
                    >
                      {/* Icon picker */}
                      <IconPicker
                        currentIcon={s.icon ?? group.icon}
                        onSelect={(iconPath) => updateSetting(group.key, { icon: iconPath })}
                      />

                      {/* Name + pod count */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{group.appName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {group.pods.filter((p) => p.state === 'running').length}/{group.pods.length} running
                        </p>
                      </div>

                      {/* Display name override */}
                      <input
                        className="w-36 shrink-0 h-7 rounded-md border border-border/60 bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        value={s.displayName}
                        placeholder={group.appName}
                        onChange={(e) => updateSetting(group.key, { displayName: e.target.value })}
                      />

                      {/* Visible */}
                      <div className="w-16 shrink-0 flex justify-center">
                        <Switch
                          checked={s.visible}
                          onCheckedChange={(v) => updateSetting(group.key, { visible: v })}
                        />
                      </div>

                      {/* Logs */}
                      <div className="w-12 shrink-0 flex justify-center">
                        <Switch
                          checked={s.showLogs}
                          onCheckedChange={(v) => updateSetting(group.key, { showLogs: v })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
