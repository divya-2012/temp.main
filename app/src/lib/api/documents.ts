import apiClient from './client';
import type { Document, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const documentsApi = {
  getDocuments: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Document>>('/documents', { params }),

  getDocument: (id: string) =>
    apiClient.get<ApiResponse<Document>>(`/documents/${id}`),

  createDocument: (payload: Record<string, unknown>) =>
    apiClient.post<ApiResponse<Document>>('/documents', payload),

  updateDocument: (id: string, payload: Record<string, unknown>) =>
    apiClient.put<ApiResponse<Document>>(`/documents/${id}`, payload),

  deleteDocument: (id: string) =>
    apiClient.delete(`/documents/${id}`),

  analyzeDocument: (id: string) =>
    apiClient.post<ApiResponse<Document>>(`/documents/${id}/analyze`),

  generateDocument: (payload: { type: string; title: string; caseId?: string; content?: string; templateData?: Record<string, unknown> }) =>
    apiClient.post<ApiResponse<{ document: Document; content: string }>>('/documents/generate', payload),
};
