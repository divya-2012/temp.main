import apiClient from './client';
import type { TimeEntry, Invoice, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const billingApi = {
  // Time Entries
  getTimeEntries: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<TimeEntry>>('/billing/time-entries', { params }),

  createTimeEntry: (payload: Partial<TimeEntry>) =>
    apiClient.post<ApiResponse<TimeEntry>>('/billing/time-entries', payload),

  updateTimeEntry: (id: string, payload: Partial<TimeEntry>) =>
    apiClient.put<ApiResponse<TimeEntry>>(`/billing/time-entries/${id}`, payload),

  deleteTimeEntry: (id: string) =>
    apiClient.delete(`/billing/time-entries/${id}`),

  // Invoices
  getInvoices: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Invoice>>('/billing/invoices', { params }),

  getInvoice: (id: string) =>
    apiClient.get<ApiResponse<Invoice>>(`/billing/invoices/${id}`),

  createInvoice: (payload: Partial<Invoice>) =>
    apiClient.post<ApiResponse<Invoice>>('/billing/invoices', payload),

  updateInvoice: (id: string, payload: Partial<Invoice>) =>
    apiClient.put<ApiResponse<Invoice>>(`/billing/invoices/${id}`, payload),
};
