'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Space, Tag, Row, Col, message, Spin } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { complianceApi } from '@/lib/api/compliance';
import { formatDate } from '@/utils/formatters';

import type { QueryParams, ComplianceItem } from '@/types';

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params: QueryParams = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await complianceApi.getItems(params);
      setItems(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await complianceApi.createItem({
        title: values.title as string,
        description: values.description as string,
        category: values.category as string,
        deadline: values.deadline ? (values.deadline as { toISOString: () => string }).toISOString() : undefined,
      } as Record<string, unknown>);
      message.success('Compliance item created');
      setModalOpen(false);
      form.resetFields();
      fetchItems();
    } catch { message.error('Failed to create item'); } finally { setSaving(false); }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await complianceApi.updateItem(id, { status: 'COMPLIANT', completedAt: new Date().toISOString() } as Record<string, unknown>);
      message.success('Marked as compliant');
      fetchItems();
    } catch { message.error('Failed to update'); }
  };

  const statusColors: Record<string, string> = { PENDING: 'orange', COMPLIANT: 'green', NON_COMPLIANT: 'red', OVERDUE: 'red' };

  const pending = items.filter(i => i.status === 'PENDING').length;
  const overdue = items.filter(i => i.status === 'OVERDUE' || i.status === 'NON_COMPLIANT').length;

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => c || '—' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag> },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => d ? formatDate(d) : '—' },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_: unknown, record: ComplianceItem) => (
        record.status !== 'COMPLIANT' ? <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkComplete(record.id)}>Complete</Button> : <Tag color="green">Done</Tag>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Compliance" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Compliance' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Item</Button>} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><StatCard title="Pending" value={pending} icon={<ExclamationCircleOutlined />} /></Col>
        <Col xs={24} sm={8}><StatCard title="Overdue / Non-Compliant" value={overdue} icon={<ExclamationCircleOutlined />} /></Col>
        <Col xs={24} sm={8}><StatCard title="Total Items" value={total} icon={<CheckCircleOutlined />} /></Col>
      </Row>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Select placeholder="Filter by status" allowClear style={{ width: 200 }} value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v || ''); setPage(1); }}
            options={[{ value: 'PENDING', label: 'Pending' }, { value: 'COMPLIANT', label: 'Compliant' }, { value: 'NON_COMPLIANT', label: 'Non-Compliant' }, { value: 'OVERDUE', label: 'Overdue' }]} />
        </div>
        <Table loading={loading} dataSource={items} columns={columns} rowKey="id"
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }} />
      </Card>
      <Modal title="Add Compliance Item" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input placeholder="Compliance item title" /></Form.Item>
          <Form.Item label="Category" name="category"><Input placeholder="e.g. Court Filing, License Renewal" /></Form.Item>
          <Form.Item label="Due Date" name="deadline"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Space><Button type="primary" htmlType="submit" loading={saving}>Create</Button><Button onClick={() => setModalOpen(false)}>Cancel</Button></Space>
        </Form>
      </Modal>
    </div>
  );
}
