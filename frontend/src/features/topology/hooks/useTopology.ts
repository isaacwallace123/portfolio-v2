'use client';

import { useState, useEffect, useCallback } from 'react';
import { topologyApi } from '../api/topologyApi';
import type { Server, SaveTopologyDto } from '../lib/types';
import { toast } from 'sonner';

export function useTopology() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopology = useCallback(async () => {
    try {
      setLoading(true);
      const data = await topologyApi.getTopology();
      setServers(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load topology';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  const saveTopology = async (data: SaveTopologyDto) => {
    try {
      await topologyApi.saveTopology(data);
      toast.success('Topology saved');
      await fetchTopology();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save topology';
      toast.error(message);
    }
  };

  const deleteServer = async (id: string) => {
    try {
      await topologyApi.deleteServer(id);
      toast.success('Server deleted');
      await fetchTopology();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete server';
      toast.error(message);
    }
  };

  return {
    servers,
    loading,
    error,
    refresh: fetchTopology,
    saveTopology,
    deleteServer,
  };
}
