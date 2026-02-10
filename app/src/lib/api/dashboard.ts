import apiClient from './client';

export interface DashboardData {
  metrics: {
    totalCases: number;
    activeCases: number;
    totalClients: number;
    pendingTasks: number;
    monthlyRevenue: number;
    overdueCompliance: number;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    type: string;
    case?: { title: string };
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }>;
}

export const dashboardApi = {
  getData: () =>
    apiClient.get<{ success: boolean; data: DashboardData }>('/dashboard'),
};
