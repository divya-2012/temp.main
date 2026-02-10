import apiClient from './client';
import type { CalendarEvent, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const calendarApi = {
  getEvents: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<CalendarEvent>>('/calendar', { params }),

  getEvent: (id: string) =>
    apiClient.get<ApiResponse<CalendarEvent>>(`/calendar/${id}`),

  createEvent: (payload: Partial<CalendarEvent>) =>
    apiClient.post<ApiResponse<CalendarEvent>>('/calendar', payload),

  updateEvent: (id: string, payload: Partial<CalendarEvent>) =>
    apiClient.put<ApiResponse<CalendarEvent>>(`/calendar/${id}`, payload),

  deleteEvent: (id: string) =>
    apiClient.delete(`/calendar/${id}`),
};
