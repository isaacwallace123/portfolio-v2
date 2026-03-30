'use client';

import { useState, useEffect } from 'react';
import type { ProjectPage, PageConnection } from '../lib/types';
import { toast } from 'sonner';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

interface UseProjectPagesOptions {
  projectId: string;
}

export function useProjectPages({ projectId }: UseProjectPagesOptions) {
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [connections, setConnections] = useState<PageConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<ProjectPage[]>('/api/project-pages', { params: { projectId } });
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data } = await apiClient.get<PageConnection[]>('/api/page-connections', { params: { projectId } });
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchPages();
      fetchConnections();
    }
  }, [projectId]);

  const createPage = async (data: Partial<ProjectPage>) => {
    try {
      const { data: newPage } = await apiClient.post<ProjectPage>('/api/project-pages', { ...data, projectId });
      toast.success('Page created');
      await fetchPages();
      return newPage;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create page');
      toast.error(message);
      throw new Error(message);
    }
  };

  const updatePage = async (id: string, data: Partial<ProjectPage>) => {
    try {
      const { data: updatedPage } = await apiClient.put<ProjectPage>('/api/project-pages', { id, ...data });
      toast.success('Page updated');
      await fetchPages();
      return updatedPage;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update page');
      toast.error(message);
      throw new Error(message);
    }
  };

  const deletePage = async (id: string) => {
    try {
      await apiClient.delete('/api/project-pages', { params: { id } });
      toast.success('Page deleted');
      await fetchPages();
      await fetchConnections();
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete page');
      toast.error(message);
      throw new Error(message);
    }
  };

  // FIXED: Don't refetch after saving positions - this was causing all nodes to reset
  const savePositions = async (updates: { id: string; position: { x: number; y: number } }[]) => {
    try {
      await Promise.all(updates.map((update) => apiClient.put('/api/project-pages', update)));

      // Update local state instead of refetching
      setPages((prevPages) =>
        prevPages.map((page) => {
          const update = updates.find((u) => u.id === page.id);
          return update ? { ...page, position: update.position } : page;
        })
      );
    } catch (error) {
      console.error('Error saving positions:', error);
      toast.error('Failed to save positions');
    }
  };

  const createConnection = async (sourcePageId: string, targetPageId: string, label?: string) => {
    try {
      await apiClient.post('/api/page-connections', { sourcePageId, targetPageId, label });
      toast.success('Connection created');
      await fetchConnections();
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create connection');
      toast.error(message);
      throw new Error(message);
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      await apiClient.delete('/api/page-connections', { params: { id } });
      toast.success('Connection deleted');
      await fetchConnections();
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete connection');
      toast.error(message);
      throw new Error(message);
    }
  };

  return {
    pages,
    connections,
    loading,
    createPage,
    updatePage,
    deletePage,
    savePositions,
    createConnection,
    deleteConnection,
    refresh: fetchPages,
  };
}
