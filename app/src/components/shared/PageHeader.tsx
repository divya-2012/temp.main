'use client';

import React from 'react';
import { Breadcrumb, Typography, Space } from 'antd';
import Link from 'next/link';

const { Title } = Typography;

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  subtitle?: string;
}

export default function PageHeader({ title, breadcrumbs, extra, subtitle }: PageHeaderProps) {
  const crumbItems = breadcrumbs?.map((item, index) => ({
    key: index,
    title: item.href ? <Link href={item.href}>{item.label}</Link> : item.label,
  }));

  return (
    <div style={{ marginBottom: 24 }}>
      {crumbItems && crumbItems.length > 0 && (
        <Breadcrumb items={crumbItems} style={{ marginBottom: 12 }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>
            {title}
          </Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              {subtitle}
            </Typography.Text>
          )}
        </Space>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  );
}
