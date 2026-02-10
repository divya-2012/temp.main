import apiClient from './client';
import type { User, ApiResponse, PaginatedResponse, QueryParams } from '@/types';

export const usersApi = {
  getUsers: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),

  getUser: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  createUser: (payload: Partial<User> & { password: string }) =>
    apiClient.post<ApiResponse<User>>('/users', payload),

  updateUser: (id: string, payload: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, payload),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),
};
