'use client';

import React from 'react';
import { Card, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number | { value: number; isPositive: boolean };
  suffix?: string;
  loading?: boolean;
}

export default function StatCard({ title, value, icon, trend, suffix, loading }: StatCardProps) {
  return (
    <Card
      loading={loading}
      style={{ height: '100%' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {title}
          </Text>
          {icon && (
            <span style={{ fontSize: 20, color: '#2563EB' }}>{icon}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
            {value}
          </Title>
          {suffix && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {suffix}
            </Text>
          )}
        </div>
        {trend !== undefined && (() => {
          const trendValue = typeof trend === 'number' ? trend : trend.value;
          const isPositive = typeof trend === 'number' ? trend >= 0 : trend.isPositive;
          return (
            <Text
              style={{
                fontSize: 13,
                color: isPositive ? '#16A34A' : '#DC2626',
              }}
            >
              {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
              {Math.abs(trendValue)}% from last month
            </Text>
          );
        })()}
      </Space>
    </Card>
  );
}
