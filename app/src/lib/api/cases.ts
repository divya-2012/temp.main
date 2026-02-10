import apiClient from './client';
import type { Case, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const casesApi = {
  getCases: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Case>>('/cases', { params }),

  getCase: (id: string) =>
    apiClient.get<ApiResponse<Case>>(`/cases/${id}`),

  createCase: (payload: Partial<Case>) =>
    apiClient.post<ApiResponse<Case>>('/cases', payload),

  updateCase: (id: string, payload: Partial<Case>) =>
    apiClient.put<ApiResponse<Case>>(`/cases/${id}`, payload),

  deleteCase: (id: string) =>
    apiClient.delete(`/cases/${id}`),

  getCaseTimeline: (caseId: string) =>
    apiClient.get<ApiResponse<{ events: unknown[] }>>(`/cases/${caseId}/timeline`),

  getCaseTasks: (caseId: string) =>
    apiClient.get<ApiResponse<{ tasks: unknown[] }>>(`/cases/${caseId}/tasks`),

  getCaseDocuments: (caseId: string) =>
    apiClient.get<ApiResponse<{ documents: unknown[] }>>(`/cases/${caseId}/documents`),
};
