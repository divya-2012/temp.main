'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Input, Button, Space, Tag, Dropdown, Avatar, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, MoreOutlined, EyeOutlined, EditOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { clientsApi } from '@/lib/api/clients';
import { formatDate, getInitials } from '@/utils/formatters';
import type { Client } from '@/types';
import type { QueryParams } from '@/types';

const { Text } = Typography;

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params: QueryParams = { page, limit: 20 };
      if (searchText) params.search = searchText;
      const res = await clientsApi.getClients(params);
      setClients(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setClients([]); } finally { setLoading(false); }
  }, [page, searchText]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const getDisplayName = (c: Client) => c.type === 'COMPANY' ? (c.companyName || '') : `${c.firstName || ''} ${c.lastName || ''}`.trim();

  const columns: ColumnsType<Client> = [
    {
      title: 'Client', key: 'client',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#2563EB' }} size={36}>{getInitials(getDisplayName(record))}</Avatar>
          <div>
            <Text strong style={{ fontSize: 14 }}>{getDisplayName(record)}</Text>
            {record.type === 'COMPANY' && record.firstName && <div><Text type="secondary" style={{ fontSize: 13 }}>{record.firstName} {record.lastName}</Text></div>}
          </div>
        </Space>
      ),
    },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (t: string) => <Tag color={t === 'COMPANY' ? 'blue' : 'default'}>{t === 'COMPANY' ? 'Company' : 'Individual'}</Tag> },
    {
      title: 'Contact', key: 'contact',
      render: (_, record) => (
        <div>
          {record.email && <div style={{ fontSize: 13 }}><MailOutlined style={{ marginRight: 6, color: '#6B7280' }} />{record.email}</div>}
          {record.phone && <div style={{ fontSize: 13 }}><PhoneOutlined style={{ marginRight: 6, color: '#6B7280' }} />{record.phone}</div>}
        </div>
      ),
    },
    { title: 'Since', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (d: string) => formatDate(d) },
    {
      title: '', key: 'actions', width: 48,
      render: (_, record) => (
        <Dropdown menu={{ items: [
          { key: 'view', label: 'View Client', icon: <EyeOutlined />, onClick: () => router.push(`/clients/${record.id}`) },
          { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
        ] }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Clients" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/clients/new')}>Add Client</Button>} />
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />} placeholder="Search clients..." value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }} style={{ maxWidth: 400 }} allowClear />
        </div>
        <Table loading={loading} columns={columns} dataSource={clients} rowKey="id"
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `${t} clients` }}
          onRow={(record) => ({ onClick: () => router.push(`/clients/${record.id}`), style: { cursor: 'pointer' } })} />
      </Card>
    </div>
  );
}
