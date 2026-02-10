'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Dropdown, Spin, message } from 'antd';
import { PlusOutlined, SearchOutlined, MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/shared/PageHeader';
import StatusTag from '@/components/shared/StatusTag';
import { casesApi } from '@/lib/api/cases';
import { formatDate } from '@/utils/formatters';
import type { Case, CaseStatus } from '@/types';
import type { QueryParams } from '@/types';

const { Option } = Select;

export default function CasesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params: QueryParams = { page, limit: 20 };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;
      const res = await casesApi.getCases(params);
      setCases(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setCases([]); } finally { setLoading(false); }
  }, [page, searchText, statusFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleDelete = async (id: string) => {
    try {
      await casesApi.deleteCase(id);
      message.success('Case deleted');
      fetchCases();
    } catch { message.error('Failed to delete case'); }
  };

  const getClientName = (c: Case) => {
    if (!c.client) return '—';
    if (c.client.type === 'COMPANY') return c.client.companyName || '';
    return [c.client.firstName, c.client.lastName].filter(Boolean).join(' ');
  };

  const columns: ColumnsType<Case> = [
    {
      title: 'Case', dataIndex: 'title', key: 'title',
      render: (title: string, record) => (
        <div>
          <a onClick={() => router.push(`/cases/${record.id}`)} style={{ fontWeight: 500 }}>{title}</a>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{record.caseNumber}</div>
        </div>
      ),
    },
    { title: 'Client', key: 'client', render: (_, record) => getClientName(record) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: CaseStatus) => <StatusTag status={s} />, width: 140 },
    { title: 'Practice Area', dataIndex: 'practiceArea', key: 'practiceArea', render: (a: string) => a || '—' },
    { title: 'Next Hearing', dataIndex: 'nextHearingDate', key: 'nextHearingDate', render: (d: string) => d ? formatDate(d) : '—' },
    { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (d: string) => formatDate(d) },
    {
      title: '', key: 'actions', width: 48,
      render: (_, record) => (
        <Dropdown menu={{ items: [
          { key: 'view', icon: <EyeOutlined />, label: 'View', onClick: () => router.push(`/cases/${record.id}`) },
          { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
          { type: 'divider' },
          { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(record.id) },
        ] }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Cases" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/cases/new')}>New Case</Button>} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="Search cases..." prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          style={{ width: 280 }} allowClear value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
        <Select placeholder="Status" allowClear style={{ width: 160 }}
          value={statusFilter || undefined} onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}>
          <Option value="OPEN">Open</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="ON_HOLD">On Hold</Option>
          <Option value="CLOSED">Closed</Option>
        </Select>
      </Space>
      <Table loading={loading} dataSource={cases} columns={columns} rowKey="id"
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `${t} cases` }} />
    </div>
  );
}
