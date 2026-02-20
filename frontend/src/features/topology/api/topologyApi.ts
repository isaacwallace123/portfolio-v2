import type {
  Server,
  ContainerInfo,
  ContainerStats,
  ContainerLogs,
  NetworkInfo,
  SystemInfo,
  NodeMetrics,
  MetricsRange,
  SaveTopologyDto,
} from '../lib/types';

const BASE_URL = '/api/topology';
const INFRA_URL = '/api/topology/infra';

export const topologyApi = {
  // Topology CRUD
  async getTopology(): Promise<Server[]> {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch topology');
    return response.json();
  },

  async saveTopology(data: SaveTopologyDto): Promise<Server> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save topology');
    }
    return response.json();
  },

  async deleteServer(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?id=${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete server');
    }
  },

  // Infra agent proxy calls
  async discoverContainers(): Promise<ContainerInfo[]> {
    const response = await fetch(`${INFRA_URL}?action=containers`);
    if (!response.ok) throw new Error('Failed to discover containers');
    return response.json();
  },

  async discoverNetworks(): Promise<NetworkInfo[]> {
    const response = await fetch(`${INFRA_URL}?action=networks`);
    if (!response.ok) throw new Error('Failed to discover networks');
    return response.json();
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await fetch(`${INFRA_URL}?action=system`);
    if (!response.ok) throw new Error('Failed to fetch system info');
    return response.json();
  },

  async getContainerStats(id: string): Promise<ContainerStats> {
    const response = await fetch(`${INFRA_URL}?action=stats&id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch container stats');
    return response.json();
  },

  async getContainerLogs(id: string, tail = 50): Promise<ContainerLogs> {
    const response = await fetch(`${INFRA_URL}?action=logs&id=${id}&tail=${tail}`);
    if (!response.ok) throw new Error('Failed to fetch container logs');
    return response.json();
  },

  async getNodeMetrics(): Promise<NodeMetrics> {
    const response = await fetch(`${INFRA_URL}?action=metrics`);
    if (!response.ok) throw new Error('Failed to fetch node metrics');
    return response.json();
  },

  async getMetricsRange(duration: string, containerName: string): Promise<MetricsRange> {
    const response = await fetch(`${INFRA_URL}?action=metricsrange&duration=${duration}&container=${encodeURIComponent(containerName)}`);
    if (!response.ok) throw new Error('Failed to fetch metrics range');
    return response.json();
  },
};
