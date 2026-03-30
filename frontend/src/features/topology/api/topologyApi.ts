import type {
  Server,
  ContainerInfo,
  ContainerStats,
  ContainerLogs,
  NetworkInfo,
  SystemInfo,
  NodeMetrics,
  MetricsRange,
  AppDependency,
  NodeInfo,
  OverwatchInsight,
  PodInsight,
  SaveTopologyDto,
} from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/topology';
const INFRA_URL = '/api/topology/infra';

export const topologyApi = {
  // Topology CRUD
  async getTopology(): Promise<Server[]> {
    const { data } = await apiClient.get<Server[]>(BASE_URL);
    return data;
  },

  async saveTopology(payload: SaveTopologyDto): Promise<Server> {
    try {
      const { data } = await apiClient.post<Server>(BASE_URL, payload);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to save topology'));
    }
  },

  async deleteServer(id: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { id } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete server'));
    }
  },

  // Infra agent proxy calls
  async discoverContainers(): Promise<ContainerInfo[]> {
    const { data } = await apiClient.get<ContainerInfo[]>(INFRA_URL, { params: { action: 'containers' } });
    return data;
  },

  async discoverNetworks(): Promise<NetworkInfo[]> {
    const { data } = await apiClient.get<NetworkInfo[]>(INFRA_URL, { params: { action: 'networks' } });
    return data;
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const { data } = await apiClient.get<SystemInfo>(INFRA_URL, { params: { action: 'system' } });
    return data;
  },

  async getContainerStats(id: string): Promise<ContainerStats> {
    const { data } = await apiClient.get<ContainerStats>(INFRA_URL, { params: { action: 'stats', id } });
    return data;
  },

  async getContainerLogs(id: string, tail = 50): Promise<ContainerLogs> {
    const { data } = await apiClient.get<ContainerLogs>(INFRA_URL, { params: { action: 'logs', id, tail } });
    return data;
  },

  async getNodeMetrics(): Promise<NodeMetrics> {
    const { data } = await apiClient.get<NodeMetrics>(INFRA_URL, { params: { action: 'metrics' } });
    return data;
  },

  async getMetricsRange(duration: string, containerName: string): Promise<MetricsRange> {
    const { data } = await apiClient.get<MetricsRange>(INFRA_URL, { params: { action: 'metricsrange', duration, container: containerName } });
    return data;
  },

  async getNodeMetricsRange(node: string, duration: string): Promise<MetricsRange> {
    const { data } = await apiClient.get<MetricsRange>(INFRA_URL, { params: { action: 'nodemetricsrange', node, duration } });
    return data;
  },

  async getDependencies(): Promise<AppDependency[]> {
    try {
      const { data } = await apiClient.get<AppDependency[]>(INFRA_URL, { params: { action: 'dependencies' } });
      return data;
    } catch {
      return [];
    }
  },

  async getNodes(): Promise<NodeInfo[]> {
    try {
      const { data } = await apiClient.get<NodeInfo[]>(INFRA_URL, { params: { action: 'nodes' } });
      return data;
    } catch {
      return [];
    }
  },

  async getOverwatchInsights(): Promise<OverwatchInsight> {
    const { data } = await apiClient.get<OverwatchInsight>(INFRA_URL, { params: { action: 'overwatch' } });
    return data;
  },

  async getPodInsights(namespace: string, app: string): Promise<PodInsight> {
    const { data } = await apiClient.get<PodInsight>(INFRA_URL, { params: { action: 'podinsights', namespace, app } });
    return data;
  },

  async getAllPodInsights(): Promise<PodInsight[]> {
    try {
      const { data } = await apiClient.get<PodInsight[]>(INFRA_URL, { params: { action: 'allpodinsights' } });
      return data;
    } catch {
      return [];
    }
  },

  async getOverwatchHistory(): Promise<OverwatchInsight[]> {
    try {
      const { data } = await apiClient.get<OverwatchInsight[]>(INFRA_URL, { params: { action: 'overwatchhistory' } });
      return data;
    } catch {
      return [];
    }
  },
};
