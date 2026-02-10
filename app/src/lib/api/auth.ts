import apiClient from './client';
import type { LoginPayload, RegisterPayload, User, ApiResponse } from '@/types';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/register', payload),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get<ApiResponse<{ user: User }>>('/auth/me'),
};
