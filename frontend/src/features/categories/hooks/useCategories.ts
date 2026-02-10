'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categoriesApi';
import type { Category } from '../lib/types';
import { toast } from 'sonner';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async (data: Parameters<typeof categoriesApi.create>[0]) => {
    try {
      await categoriesApi.create(data);
      toast.success('Category added');
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add category';
      toast.error(message);
    }
  };

  const updateCategory = async (id: string, data: Parameters<typeof categoriesApi.update>[1]) => {
    try {
      await categoriesApi.update(id, data);
      toast.success('Category updated');
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      toast.error(message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      toast.success('Category removed');
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove category';
      toast.error(message);
    }
  };

  const reorderCategories = async (ids: string[]) => {
    try {
      await categoriesApi.reorder(ids);
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder categories';
      toast.error(message);
      await fetchCategories();
    }
  };

  return {
    categories,
    setCategories,
    loading,
    error,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
