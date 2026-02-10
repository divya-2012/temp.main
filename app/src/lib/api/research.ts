import apiClient from './client';
import type { ApiResponse } from '@/types';

export const researchApi = {
  search: (query: string, filters?: Record<string, unknown>) =>
    apiClient.post<ApiResponse<{ results: unknown[]; answer: string }>>('/research', {
      query,
      ...filters,
    }),

  chat: (payload: { message: string; history?: Array<{ role: string; content: string }>; jurisdiction?: string; mode?: string }) =>
    apiClient.post<ApiResponse<{ message: string }>>('/research/chat', payload),

  getHistory: () =>
    apiClient.get<ApiResponse<{ queries: unknown[] }>>('/research/history'),
};
