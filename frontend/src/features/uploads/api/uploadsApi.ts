import type { UploadedFile, UploadResult } from '../lib/types';

const BASE_URL = '/api/uploads';

export const uploadsApi = {
  async list(folder?: string): Promise<UploadedFile[]> {
    const url = folder ? `${BASE_URL}?folder=${encodeURIComponent(folder)}` : BASE_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to list uploads');
    return response.json();
  },

  async upload(file: File, folder?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const url = folder ? `${BASE_URL}?folder=${encodeURIComponent(folder)}` : BASE_URL;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    return response.json();
  },

  async delete(name: string): Promise<void> {
    const response = await fetch(`${BASE_URL}?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }
  },
};
