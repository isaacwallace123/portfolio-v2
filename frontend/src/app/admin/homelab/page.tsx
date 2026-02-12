'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ZoomIn, ZoomOut, Maximize, Search, Link2, Save, Trash2,
  Server as ServerIcon, Globe2, Router, Database, Network, Shield, Plus,
  Settings, X,
} from 'lucide-react';
import { ContainerNode, type ContainerNodeData } from '@/features/topology/ui/ContainerNode';
import { InfrastructureNode, type InfrastructureNodeData } from '@/features/topology/ui/InfrastructureNode';
import { IconPicker } from '@/features/topology/ui/IconPicker';
import { detectIconFromContainer } from '@/features/topology/lib/iconMap';
import { topologyApi } from '@/features/topology/api/topologyApi';
import { useTopology } from '@/features/topology/hooks/useTopology';
import type { ContainerInfo, TopologyNode, TopologyConnection, SaveTopologyDto } from '@/features/topology/lib/types';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  containerNode: ContainerNode,
  infrastructureNode: InfrastructureNode,
};

const BOUNDS: [[number, number], [number, number]] = [
  [-2000, -2000],
  [2000, 2000],
];

const INFRA_PALETTE = [
  { type: 'internet', label: 'Internet', icon: Globe2, color: 'text-blue-500' },
  { type: 'router', label: 'Router', icon: Router, color: 'text-orange-500' },
  { type: 'server', label: 'Server', icon: ServerIcon, color: 'text-green-500' },
  { type: 'database', label: 'Database', icon: Database, color: 'text-purple-500' },
  { type: 'switch', label: 'Switch', icon: Network, color: 'text-cyan-500' },
  { type: 'firewall', label: 'Firewall', icon: Shield, color: 'text-red-500' },
] as const;

interface NodeState {
  containerId: string;
  containerName: string;
  icon: string | null;
  positionX: number;
  positionY: number;
  visible: boolean;
  showLogs: boolean;
  order: number;
  nodeType?: string;
  infrastructureType?: string;
}

function HomelabEditor() {
  const { servers, loading, saveTopology } = useTopology();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Server form
  const [serverName, setServerName] = useState('');
  const [serverType, setServerType] = useState('UNRAID');
  const [serverDescription, setServerDescription] = useState('');
  const [serverId, setServerId] = useState<string | undefined>();

  // Node states
  const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(new Map());
  const [discoveredContainers, setDiscoveredContainers] = useState<ContainerInfo[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);

  // Railway-style UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [addSearchFilter, setAddSearchFilter] = useState('');

  const initializedRef = useRef(false);
  const infraCounter = useRef(0);
  const pendingAutoSave = useRef(false);

  // Load existing topology
  useEffect(() => {
    if (loading || initializedRef.current) return;
    initializedRef.current = true;

    if (servers.length > 0) {
      const server = servers[0];
      setServerId(server.id);
      setServerName(server.name);
      setServerType(server.type);
      setServerDescription(server.description || '');

      const statesMap = new Map<string, NodeState>();
      const flowNodes: Node[] = server.nodes.map((node: TopologyNode) => {
        const nodeKey = node.containerName;
        statesMap.set(nodeKey, {
          containerId: node.containerId,
          containerName: node.containerName,
          icon: node.icon,
          positionX: node.positionX,
          positionY: node.positionY,
          visible: node.visible,
          showLogs: node.showLogs,
          order: node.order,
          nodeType: node.nodeType,
          infrastructureType: node.infrastructureType ?? undefined,
        });

        if (node.nodeType === 'infrastructure') {
          return {
            id: nodeKey,
            type: 'infrastructureNode',
            position: { x: node.positionX, y: node.positionY },
            data: {
              label: node.containerName,
              infrastructureType: node.infrastructureType || 'server',
              editable: true,
            } satisfies InfrastructureNodeData,
          };
        }

        return {
          id: nodeKey,
          type: 'containerNode',
          position: { x: node.positionX, y: node.positionY },
          data: {
            containerName: node.containerName,
            containerId: node.containerId,
            icon: node.icon,
            editable: true,
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

      setNodeStates(statesMap);
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [loading, servers, setNodes, setEdges]);

  // Discover containers from Docker
  const handleDiscover = useCallback(async () => {
    setDiscovering(true);
    try {
      const containers = await topologyApi.discoverContainers();
      setDiscoveredContainers(containers);

      const existingNames = new Set(
        Array.from(nodeStates.entries())
          .filter(([, s]) => !s.nodeType || s.nodeType === 'container')
          .map(([key]) => key)
      );
      let newCount = 0;
      const newNodes: Node<ContainerNodeData>[] = [];
      const updatedStates = new Map(nodeStates);

      for (const container of containers) {
        const key = container.name;
        if (!existingNames.has(key)) {
          const autoIcon = detectIconFromContainer(container.image || '', container.name);
          const state: NodeState = {
            containerId: container.id,
            containerName: container.name,
            icon: autoIcon,
            positionX: 100 + (newCount % 4) * 200,
            positionY: 100 + Math.floor(newCount / 4) * 150,
            visible: true,
            showLogs: true,
            order: existingNames.size + newCount,
            nodeType: 'container',
          };
          updatedStates.set(key, state);

          newNodes.push({
            id: key,
            type: 'containerNode',
            position: { x: state.positionX, y: state.positionY },
            data: {
              containerName: container.name,
              containerId: container.id,
              icon: autoIcon,
              state: container.state,
              health: container.health,
              editable: true,
            },
          });
          newCount++;
        } else {
          const existing = updatedStates.get(key);
          if (existing) {
            updatedStates.set(key, { ...existing, containerId: container.id });
          }
          setNodes((prev) =>
            prev.map((n) =>
              n.id === key
                ? { ...n, data: { ...n.data, state: container.state, health: container.health, containerId: container.id } }
                : n
            )
          );
        }
      }

      if (newCount > 0) {
        setNodes((prev) => [...prev, ...newNodes]);
      }
      setNodeStates(updatedStates);

      if (newCount > 0) {
        toast.success(`Discovered ${newCount} new container(s)`);
      } else {
        toast.info('Container states updated');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to discover containers');
    } finally {
      setDiscovering(false);
    }
  }, [nodeStates, setNodes]);

  // Add infrastructure node
  const handleAddInfrastructure = useCallback(
    (infraType: string, label: string) => {
      const key = `infra-${infraType}-${Date.now()}-${infraCounter.current++}`;
      const state: NodeState = {
        containerId: key,
        containerName: label,
        icon: null,
        positionX: 300 + Math.random() * 200,
        positionY: 100 + Math.random() * 200,
        visible: true,
        showLogs: true,
        order: nodeStates.size,
        nodeType: 'infrastructure',
        infrastructureType: infraType,
      };

      setNodeStates((prev) => {
        const next = new Map(prev);
        next.set(key, state);
        return next;
      });

      setNodes((prev) => [
        ...prev,
        {
          id: key,
          type: 'infrastructureNode',
          position: { x: state.positionX, y: state.positionY },
          data: {
            label,
            infrastructureType: infraType,
            editable: true,
          } satisfies InfrastructureNodeData,
        },
      ]);

      toast.success(`Added ${label} node`);
    },
    [nodeStates, setNodes]
  );

  // Auto-detect connections
  const handleAutoDetect = useCallback(async () => {
    try {
      const networks = await topologyApi.discoverNetworks();
      const nodeKeys = new Set(
        Array.from(nodeStates.entries())
          .filter(([, s]) => !s.nodeType || s.nodeType === 'container')
          .map(([key]) => key)
      );
      let newEdges = 0;
      const existingEdgePairs = new Set(edges.map((e) => `${e.source}-${e.target}`));

      for (const network of networks) {
        const matchedContainers = network.containers.filter((c) => nodeKeys.has(c));
        for (let i = 0; i < matchedContainers.length; i++) {
          for (let j = i + 1; j < matchedContainers.length; j++) {
            const pairKey = `${matchedContainers[i]}-${matchedContainers[j]}`;
            const reversePairKey = `${matchedContainers[j]}-${matchedContainers[i]}`;
            if (!existingEdgePairs.has(pairKey) && !existingEdgePairs.has(reversePairKey)) {
              setEdges((prev) => [
                ...prev,
                {
                  id: `auto-${Date.now()}-${i}-${j}`,
                  source: matchedContainers[i],
                  target: matchedContainers[j],
                  label: network.name,
                  type: 'smoothstep',
                  animated: true,
                },
              ]);
              existingEdgePairs.add(pairKey);
              newEdges++;
            }
          }
        }
      }

      if (newEdges > 0) {
        toast.success(`Detected ${newEdges} connection(s) from Docker networks`);
      } else {
        toast.info('No new connections detected');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to detect connections');
    }
  }, [nodeStates, edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setEdges((prev) => [
          ...prev,
          {
            id: `manual-${Date.now()}`,
            source: params.source!,
            target: params.target!,
            type: 'smoothstep',
            animated: true,
          },
        ]);
      }
    },
    [setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((prev) => prev.filter((e) => e.id !== edge.id));
    },
    [setEdges]
  );

  const toggleVisibility = useCallback(
    (nodeKey: string) => {
      pendingAutoSave.current = true;
      setNodeStates((prev) => {
        const next = new Map(prev);
        const state = next.get(nodeKey);
        if (state) {
          next.set(nodeKey, { ...state, visible: !state.visible });
        }
        return next;
      });
    },
    []
  );

  const toggleShowLogs = useCallback(
    (nodeKey: string) => {
      pendingAutoSave.current = true;
      setNodeStates((prev) => {
        const next = new Map(prev);
        const state = next.get(nodeKey);
        if (state) {
          next.set(nodeKey, { ...state, showLogs: !state.showLogs });
        }
        return next;
      });
    },
    []
  );

  const handleIconChange = useCallback(
    (nodeKey: string, iconPath: string) => {
      setNodeStates((prev) => {
        const next = new Map(prev);
        const state = next.get(nodeKey);
        if (state) {
          next.set(nodeKey, { ...state, icon: iconPath });
        }
        return next;
      });
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeKey ? { ...n, data: { ...n.data, icon: iconPath } } : n
        )
      );
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (nodeKey: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeKey));
      setEdges((prev) => prev.filter((e) => e.source !== nodeKey && e.target !== nodeKey));
      setNodeStates((prev) => {
        const next = new Map(prev);
        next.delete(nodeKey);
        return next;
      });
    },
    [setNodes, setEdges]
  );

  const handleSave = useCallback(async () => {
    if (!serverName.trim()) {
      toast.error('Server name is required');
      return;
    }

    setSaving(true);
    try {
      const nodesData = nodes.map((node, index) => {
        const state = nodeStates.get(node.id);
        return {
          containerId: state?.containerId || node.id,
          containerName: state?.containerName || node.data.containerName || node.data.label || node.id,
          icon: state?.icon || node.data.icon || null,
          positionX: node.position.x,
          positionY: node.position.y,
          visible: state?.visible ?? true,
          showLogs: state?.showLogs ?? true,
          order: index,
          nodeType: state?.nodeType || 'container',
          infrastructureType: state?.infrastructureType,
        };
      });

      const connectionsData = edges.map((edge) => ({
        sourceId: edge.source,
        targetId: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
        animated: edge.animated ?? true,
      }));

      const payload: SaveTopologyDto = {
        server: {
          id: serverId,
          name: serverName,
          type: serverType,
          description: serverDescription || undefined,
        },
        nodes: nodesData,
        connections: connectionsData,
      };

      await saveTopology(payload);
    } catch {
      // Error already toasted in hook
    } finally {
      setSaving(false);
    }
  }, [serverName, serverType, serverDescription, serverId, nodes, edges, nodeStates, saveTopology]);

  // Auto-save when toggling visibility/showLogs
  useEffect(() => {
    if (pendingAutoSave.current) {
      pendingAutoSave.current = false;
      handleSave();
    }
  }, [nodeStates, handleSave]);

  // Node click → open right panel
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Pane click → close right panel
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Get data for the selected node panel
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedState = selectedNodeId ? nodeStates.get(selectedNodeId) : null;
  const selectedContainer = selectedNodeId
    ? discoveredContainers.find((c) => c.name === selectedNodeId)
    : null;
  const isSelectedContainer = selectedNode?.type === 'containerNode';
  const isSelectedInfra = selectedNode?.type === 'infrastructureNode';

  return (
    <div className="relative h-full w-full">
      {/* Full-bleed canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        translateExtent={BOUNDS}
        nodeExtent={BOUNDS}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background />
      </ReactFlow>

      {/* Left floating toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 rounded-xl border bg-background/90 backdrop-blur-sm shadow-lg p-1.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setAddDialogOpen(true)}
          title="Add node"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleAutoDetect}
          title="Auto-detect connections"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={saving}
          title="Save topology"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setSettingsDialogOpen(true)}
          title="Server settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Separator className="my-1" />

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomIn()} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomOut()} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => fitView()} title="Fit view">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* Right detail panel — shown when a node is selected */}
      {selectedNode && (
        <div className="absolute top-0 right-0 z-20 h-full w-80 border-l bg-background/95 backdrop-blur-sm shadow-lg flex flex-col animate-in slide-in-from-right duration-200">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold truncate">
              {isSelectedContainer
                ? (selectedState?.containerName || selectedNode.data.containerName).replace(/^portfolio_/, '')
                : selectedState?.containerName || selectedNode.data.label}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setSelectedNodeId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel body */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Type badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {isSelectedInfra
                    ? selectedState?.infrastructureType || selectedNode.data.infrastructureType
                    : 'container'}
                </Badge>
                {isSelectedContainer && selectedContainer && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedContainer.state}
                  </Badge>
                )}
              </div>

              {/* Icon picker (containers only) */}
              {isSelectedContainer && selectedNodeId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <IconPicker
                    currentIcon={selectedState?.icon || selectedNode.data.icon || null}
                    onSelect={(iconPath) => handleIconChange(selectedNodeId, iconPath)}
                  />
                </div>
              )}

              {/* Visibility toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Visible on public page</Label>
                <Switch
                  checked={selectedState?.visible !== false}
                  onCheckedChange={() => selectedNodeId && toggleVisibility(selectedNodeId)}
                />
              </div>

              {/* Show logs toggle */}
              {isSelectedContainer && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Allow view logs</Label>
                  <Switch
                    checked={selectedState?.showLogs !== false}
                    onCheckedChange={() => selectedNodeId && toggleShowLogs(selectedNodeId)}
                  />
                </div>
              )}

              <Separator />

              {/* Delete */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (selectedNodeId) {
                    removeNode(selectedNodeId);
                    setSelectedNodeId(null);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Node
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add Node Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
            <DialogDescription>
              Add infrastructure or discover Docker containers.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Filter..."
            value={addSearchFilter}
            onChange={(e) => setAddSearchFilter(e.target.value)}
            className="h-8 text-sm"
          />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Infrastructure</p>
            <div className="grid grid-cols-3 gap-2">
              {INFRA_PALETTE
                .filter((item) => item.label.toLowerCase().includes(addSearchFilter.toLowerCase()))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        handleAddInfrastructure(item.type, item.label);
                        setAddDialogOpen(false);
                        setAddSearchFilter('');
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Docker</p>
            <Button
              onClick={() => {
                handleDiscover();
                setAddDialogOpen(false);
                setAddSearchFilter('');
              }}
              disabled={discovering}
              className="w-full"
              size="sm"
            >
              <Search className="mr-2 h-4 w-4" />
              {discovering ? 'Discovering...' : 'Discover Containers'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ServerIcon className="h-4 w-4" />
              Server Settings
            </DialogTitle>
            <DialogDescription>
              Configure the server metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Unraid Tower"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Input
                value={serverType}
                onChange={(e) => setServerType(e.target.value)}
                placeholder="UNRAID"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder="Optional description"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminHomelabPage() {
  return (
    <div className="h-full">
      <ReactFlowProvider>
        <HomelabEditor />
      </ReactFlowProvider>
    </div>
  );
}
