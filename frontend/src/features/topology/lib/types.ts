// Database models

export type Server = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  icon: string | null;
  nodes: TopologyNode[];
  createdAt: string;
  updatedAt: string;
};

export type TopologyNode = {
  id: string;
  serverId: string;
  containerId: string;
  containerName: string;
  icon: string | null;
  positionX: number;
  positionY: number;
  visible: boolean;
  showLogs: boolean;
  order: number;
  nodeType: string;
  infrastructureType: string | null;
  outgoing: TopologyConnection[];
  incoming: TopologyConnection[];
  createdAt: string;
  updatedAt: string;
};

export type TopologyConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  animated: boolean;
  createdAt: string;
};

// Go backend response types

export type ContainerInfo = {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  health: string;
  networks: string[];
  ports: PortBinding[];
  created: string;
};

export type PortBinding = {
  privatePort: number;
  publicPort?: number;
  type: string;
};

export type ContainerStats = {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
};

export type ContainerLogs = {
  containerId: string;
  lines: string[];
};

export type NetworkInfo = {
  id: string;
  name: string;
  driver: string;
  containers: string[];
};

export type SystemInfo = {
  os: string;
  architecture: string;
  cpus: number;
  memoryTotal: number;
  dockerVersion: string;
  containers: number;
  running: number;
  stopped: number;
  ip: string;
  publicIP: string;
};

export type NodeMetrics = {
  cpu: number | null;
  memory: number | null;
  disk: number | null;
  uptime: number | null;
  totalMemory: number | null;
  diskReadRate: number | null;
  diskWriteRate: number | null;
  networkRxRate: number | null;
  networkTxRate: number | null;
};

export type MetricPoint = {
  time: string;
  value: number;
};

export type MetricsRange = {
  cpu: MetricPoint[];
  memory: MetricPoint[];
  disk: MetricPoint[];
  networkRx: MetricPoint[];
  networkTx: MetricPoint[];
  diskRead: MetricPoint[];
  diskWrite: MetricPoint[];
};

// DTOs

export type SaveTopologyDto = {
  server: {
    id?: string;
    name: string;
    type: string;
    description?: string;
    icon?: string;
  };
  nodes: {
    id?: string;
    containerId: string;
    containerName: string;
    icon?: string;
    positionX: number;
    positionY: number;
    visible: boolean;
    showLogs?: boolean;
    order: number;
    nodeType?: string;
    infrastructureType?: string;
  }[];
  connections: {
    id?: string;
    sourceId: string;
    targetId: string;
    label?: string;
    animated?: boolean;
  }[];
};

export type InfrastructureNodeType = 'router' | 'internet' | 'server' | 'database' | 'switch' | 'firewall';
