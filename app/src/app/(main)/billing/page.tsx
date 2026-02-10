'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Tag, Row, Col, Spin, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { billingApi } from '@/lib/api/billing';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { TimeEntry, Invoice } from '@/types';

export default function BillingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingTE, setLoadingTE] = useState(true);
  const [loadingInv, setLoadingInv] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchTimeEntries = useCallback(async () => {
    try { setLoadingTE(true); const res = await billingApi.getTimeEntries({ limit: 50 }); setTimeEntries(res.data.data || []); }
    catch { setTimeEntries([]); } finally { setLoadingTE(false); }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try { setLoadingInv(true); const res = await billingApi.getInvoices({ limit: 50 }); setInvoices(res.data.data || []); }
    catch { setInvoices([]); } finally { setLoadingInv(false); }
  }, []);

  useEffect(() => { fetchTimeEntries(); fetchInvoices(); }, [fetchTimeEntries, fetchInvoices]);

  const handleLogTime = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await billingApi.createTimeEntry({
        description: values.description as string,
        hours: values.hours as number,
        rate: values.rate as number,
        date: (values.date as { toISOString: () => string }).toISOString(),
        caseId: values.caseId as string,
      } as Record<string, unknown>);
      message.success('Time entry created');
      setLogModalOpen(false);
      logForm.resetFields();
      fetchTimeEntries();
    } catch { message.error('Failed to log time'); } finally { setSaving(false); }
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalBilled = timeEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  const teColumns = [
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 80 },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, render: (v: number) => formatCurrency(v) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => formatCurrency(v) },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (d: string) => formatDate(d) },
  ];

  const invColumns = [
    { title: 'Invoice #', dataIndex: 'invoiceNo', key: 'invoiceNo' },
    { title: 'Client', key: 'client', render: (_: unknown, r: Invoice) => {
      const client = r.client;
      return client ? (client.companyName || `${client.firstName} ${client.lastName}`) : '—';
    }},
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => formatCurrency(v) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'PAID' ? 'green' : s === 'OVERDUE' ? 'red' : s === 'SENT' ? 'blue' : 'default'}>{s}</Tag> },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => formatDate(d) },
  ];

  return (
    <div>
      <PageHeader title="Billing" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Billing' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setLogModalOpen(true)}>Log Time</Button>} />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><StatCard title="Total Hours" value={totalHours.toFixed(1)} icon={<ClockCircleOutlined />} /></Col>
        <Col xs={24} sm={8}><StatCard title="Total Billed" value={formatCurrency(totalBilled)} icon={<DollarOutlined />} /></Col>
        <Col xs={24} sm={8}><StatCard title="Invoices" value={invoices.length} icon={<DollarOutlined />} /></Col>
      </Row>
      <Card>
        <Tabs defaultActiveKey="time" items={[
          { key: 'time', label: 'Time Entries', children: <Table loading={loadingTE} dataSource={timeEntries} columns={teColumns} rowKey="id" pagination={{ pageSize: 20 }} /> },
          { key: 'invoices', label: 'Invoices', children: <Table loading={loadingInv} dataSource={invoices} columns={invColumns} rowKey="id" pagination={{ pageSize: 20 }} /> },
        ]} />
      </Card>
      <Modal title="Log Time" open={logModalOpen} onCancel={() => setLogModalOpen(false)} footer={null}>
        <Form form={logForm} layout="vertical" onFinish={handleLogTime}>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input placeholder="What did you work on?" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Hours" name="hours" rules={[{ required: true }]}><InputNumber min={0.1} step={0.25} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Rate ($/hr)" name="rate" initialValue={350}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Date" name="date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="Case ID (optional)" name="caseId"><Input placeholder="Case ID" /></Form.Item>
          <Space><Button type="primary" htmlType="submit" loading={saving}>Log Time</Button><Button onClick={() => setLogModalOpen(false)}>Cancel</Button></Space>
        </Form>
      </Modal>
    </div>
  );
}
