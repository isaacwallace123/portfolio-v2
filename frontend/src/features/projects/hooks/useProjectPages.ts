'use client';

import { useState, useEffect } from 'react';
import type { ProjectPage, PageConnection } from '../lib/types';
import { toast } from 'sonner';

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
      const response = await fetch(`/api/project-pages?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
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
      const response = await fetch(`/api/page-connections?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
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
      const response = await fetch('/api/project-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
      }

      const newPage = await response.json();
      toast.success('Page created');
      await fetchPages();
      return newPage;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create page';
      toast.error(message);
      throw error;
    }
  };

  const updatePage = async (id: string, data: Partial<ProjectPage>) => {
    try {
      const response = await fetch('/api/project-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update page');
      }

      const updatedPage = await response.json();
      toast.success('Page updated');
      await fetchPages();
      return updatedPage;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update page';
      toast.error(message);
      throw error;
    }
  };

  const deletePage = async (id: string) => {
    try {
      const response = await fetch(`/api/project-pages?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete page');

      toast.success('Page deleted');
      await fetchPages();
      await fetchConnections();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete page';
      toast.error(message);
      throw error;
    }
  };

  // FIXED: Don't refetch after saving positions - this was causing all nodes to reset
  const savePositions = async (updates: { id: string; position: { x: number; y: number } }[]) => {
    try {
      await Promise.all(
        updates.map((update) =>
          fetch('/api/project-pages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          })
        )
      );
      
      // Update local state instead of refetching
      setPages(prevPages => 
        prevPages.map(page => {
          const update = updates.find(u => u.id === page.id);
          if (update) {
            return { ...page, position: update.position };
          }
          return page;
        })
      );
      
      // Don't show toast for every position save - too noisy
      // toast.success('Positions saved');
    } catch (error) {
      console.error('Error saving positions:', error);
      toast.error('Failed to save positions');
    }
  };

  const createConnection = async (sourcePageId: string, targetPageId: string, label?: string) => {
    try {
      const response = await fetch('/api/page-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePageId, targetPageId, label }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create connection');
      }

      toast.success('Connection created');
      await fetchConnections();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create connection';
      toast.error(message);
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const response = await fetch(`/api/page-connections?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete connection');

      toast.success('Connection deleted');
      await fetchConnections();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete connection';
      toast.error(message);
      throw error;
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