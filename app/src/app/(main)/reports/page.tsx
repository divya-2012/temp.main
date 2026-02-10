'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Spin, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { dashboardApi, type DashboardData } from '@/lib/api/dashboard';
import { FolderOpenOutlined, TeamOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#6B7280'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const res = await dashboardApi.getData(); setData(res.data.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const m = data?.metrics;
  const caseStatusData = [
    { name: 'Active', value: m?.activeCases || 0 },
    { name: 'Total', value: (m?.totalCases || 0) - (m?.activeCases || 0) },
  ];
  const revenueData = [
    { month: 'This Month', revenue: m?.monthlyRevenue || 0 },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Cases" value={m?.totalCases ?? 0} icon={<FolderOpenOutlined />} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Active Cases" value={m?.activeCases ?? 0} icon={<FolderOpenOutlined />} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Clients" value={m?.totalClients ?? 0} icon={<TeamOutlined />} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Monthly Revenue" value={formatCurrency(m?.monthlyRevenue ?? 0)} icon={<DollarOutlined />} /></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Case Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={caseStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {caseStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Monthly Revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
