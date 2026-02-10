'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, List, Button, Typography, Space, Tag, Spin, Empty } from 'antd';
import {
  PlusOutlined, FolderOpenOutlined, TeamOutlined, FileTextOutlined,
  CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import dayjs from 'dayjs';

const { Text } = Typography;

const eventTypeColors: Record<string, string> = {
  HEARING: '#DC2626', MEETING: '#2563EB', DEADLINE: '#D97706',
  TASK: '#16A34A', COURT_DATE: '#DC2626', OTHER: '#6B7280',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getData();
      setData(res.data.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const activeCases = data?.metrics?.activeCases || 0;
  const casesTrendData = months.map((m, i) => ({ month: m, cases: Math.max(1, activeCases + i * 2) }));
  const monthlyRev = data?.metrics?.monthlyRevenue || 0;
  const revenueData = months.map((m, i) => ({ month: m, revenue: Math.max(0, monthlyRev * (0.7 + i * 0.06)) }));

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.firstName || 'User'}`}
        subtitle={dayjs().format('dddd, MMMM D, YYYY')}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => router.push('/cases/new')}>Create Case</Button>
            <Button icon={<TeamOutlined />} onClick={() => router.push('/clients/new')}>Add Client</Button>
            <Button icon={<FileTextOutlined />} onClick={() => router.push('/documents')}>Upload Document</Button>
            <Button icon={<CalendarOutlined />} onClick={() => router.push('/calendar')}>Schedule Event</Button>
          </Space>
        }
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard title="Active Cases" value={data?.metrics?.activeCases ?? 0} icon={<FolderOpenOutlined />} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard title="Open Tasks" value={data?.metrics?.pendingTasks ?? 0} icon={<ClockCircleOutlined />} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard title="Compliance Alerts" value={data?.metrics?.overdueCompliance ?? 0} icon={<ExclamationCircleOutlined />} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard title="Total Clients" value={data?.metrics?.totalClients ?? 0} icon={<TeamOutlined />} />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Case Trends" styles={{ body: { padding: '16px 24px' } }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={casesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                    <YAxis tick={{ fontSize: 13 }} />
                    <Tooltip />
                    <Bar dataKey="cases" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Revenue Overview" styles={{ body: { padding: '16px 24px' } }}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                    <YAxis tick={{ fontSize: 13 }} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card title="Upcoming Events" extra={<Button type="link" onClick={() => router.push('/calendar')}>View All</Button>}>
                {data?.upcomingEvents?.length ? (
                  <List dataSource={data.upcomingEvents} renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<CalendarOutlined style={{ fontSize: 18, color: eventTypeColors[item.type] || '#6B7280' }} />}
                        title={<Text style={{ fontSize: 14 }}>{item.title}</Text>}
                        description={<Space><Text type="secondary" style={{ fontSize: 13 }}>{dayjs(item.startTime).format('MMM D, YYYY h:mm A')}</Text><Tag color={eventTypeColors[item.type]} style={{ fontSize: 11 }}>{item.type}</Tag></Space>}
                      />
                    </List.Item>
                  )} />
                ) : <Empty description="No upcoming events" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card title="Recent Activity">
                {data?.recentActivity?.length ? (
                  <List dataSource={data.recentActivity} renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<FolderOpenOutlined style={{ color: '#2563EB' }} />}
                        title={<Text style={{ fontSize: 14 }}>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'} — {item.action}</Text>}
                        description={<div><Text style={{ fontSize: 13 }}>{item.entity}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{formatRelativeTime(item.createdAt)}</Text></div>}
                      />
                    </List.Item>
                  )} />
                ) : <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
