import apiClient from './client';
import type { ComplianceItem, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const complianceApi = {
  getItems: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<ComplianceItem>>('/compliance', { params }),

  getItem: (id: string) =>
    apiClient.get<ApiResponse<ComplianceItem>>(`/compliance/${id}`),

  createItem: (payload: Partial<ComplianceItem>) =>
    apiClient.post<ApiResponse<ComplianceItem>>('/compliance', payload),

  updateItem: (id: string, payload: Partial<ComplianceItem>) =>
    apiClient.put<ApiResponse<ComplianceItem>>(`/compliance/${id}`, payload),

  deleteItem: (id: string) =>
    apiClient.delete(`/compliance/${id}`),
};
