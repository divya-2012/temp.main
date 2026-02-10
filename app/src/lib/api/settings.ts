import apiClient from './client';

export const settingsApi = {
  getSettings: () =>
    apiClient.get<{ success: boolean; data: { user: Record<string, unknown>; firm: Record<string, unknown> } }>('/settings'),

  updateProfile: (profile: Record<string, unknown>) =>
    apiClient.put('/settings', { profile }),

  updateFirm: (firm: Record<string, unknown>) =>
    apiClient.put('/settings', { firm }),

  changePassword: (password: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/settings', { password }),
};
