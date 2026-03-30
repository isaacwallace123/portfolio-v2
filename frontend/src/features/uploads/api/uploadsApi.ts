import type { UploadedFile, UploadResult } from '../lib/types';
import apiClient, { getErrorMessage } from '@/lib/apiClient';

const BASE_URL = '/api/uploads';

export const uploadsApi = {
  async list(folder?: string): Promise<UploadedFile[]> {
    const { data } = await apiClient.get<UploadedFile[]>(BASE_URL, {
      params: folder ? { folder } : undefined,
    });
    return data;
  },

  async upload(file: File, folder?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await apiClient.post<UploadResult>(BASE_URL, formData, {
        params: folder ? { folder } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to upload file'));
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await apiClient.delete(BASE_URL, { params: { key } });
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to delete file'));
    }
  },
};
