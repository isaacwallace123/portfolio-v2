import axios, { type AxiosError } from 'axios';

const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Extracts a human-readable message from any thrown value. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<{ error?: string; details?: { message: string }[] }>).response?.data;
    return data?.details?.[0]?.message ?? data?.error ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default apiClient;
