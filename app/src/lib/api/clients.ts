import apiClient from './client';
import type { Client, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const clientsApi = {
  getClients: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Client>>('/clients', { params }),

  getClient: (id: string) =>
    apiClient.get<ApiResponse<Client>>(`/clients/${id}`),

  createClient: (payload: Partial<Client>) =>
    apiClient.post<ApiResponse<Client>>('/clients', payload),

  updateClient: (id: string, payload: Partial<Client>) =>
    apiClient.put<ApiResponse<Client>>(`/clients/${id}`, payload),

  deleteClient: (id: string) =>
    apiClient.delete(`/clients/${id}`),

  getClientCases: (clientId: string) =>
    apiClient.get<ApiResponse<{ cases: unknown[] }>>(`/clients/${clientId}/cases`),
};
