'use client';

import { useState, useEffect } from 'react';
import { uploadsApi } from '../api/uploadsApi';
import type { UploadedFile } from '../lib/types';
import { toast } from 'sonner';

export function useUploads() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await uploadsApi.list();
      setFiles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const result = await uploadsApi.upload(file);
      toast.success(`Uploaded ${result.originalName}`);
      await fetchFiles();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (name: string) => {
    try {
      await uploadsApi.delete(name);
      toast.success('File deleted');
      await fetchFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(message);
    }
  };

  return {
    files,
    loading,
    uploading,
    refresh: fetchFiles,
    uploadFile,
    deleteFile,
  };
}
