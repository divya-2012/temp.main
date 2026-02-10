'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Select, Row, Col, Button, Space, DatePicker, Divider, message, Spin } from 'antd';
import PageHeader from '@/components/shared/PageHeader';
import { casesApi } from '@/lib/api/cases';
import { clientsApi } from '@/lib/api/clients';
import { usersApi } from '@/lib/api/users';

const { TextArea } = Input;

export default function NewCasePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; firstName?: string; lastName?: string; companyName?: string; type: string }>>([]);
  const [attorneys, setAttorneys] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

  useEffect(() => {
    clientsApi.getClients({ limit: 200 }).then(res => setClients(res.data.data || [])).catch(() => {});
    usersApi.getUsers({ limit: 200 }).then(res => setAttorneys(res.data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        filingDate: values.filingDate ? (values.filingDate as { toISOString: () => string }).toISOString() : undefined,
        nextHearingDate: values.nextHearingDate ? (values.nextHearingDate as { toISOString: () => string }).toISOString() : undefined,
      };
      await casesApi.createCase(payload as Partial<import('@/types').Case>);
      message.success('Case created successfully!');
      router.push('/cases');
    } catch { message.error('Failed to create case'); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Create New Case" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases', href: '/cases' }, { label: 'New Case' }]} />
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="middle">
          <Divider plain>Case Information</Divider>
          <Row gutter={16}>
            <Col span={16}><Form.Item label="Title" name="title" rules={[{ required: true }]}><Input placeholder="Case title" /></Form.Item></Col>
            <Col span={8}><Form.Item label="Practice Area" name="practiceArea"><Input placeholder="e.g. Personal Injury" /></Form.Item></Col>
          </Row>
          <Form.Item label="Description" name="description"><TextArea rows={3} placeholder="Brief case description..." /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Priority" name="priority" initialValue="MEDIUM">
              <Select options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' }]} />
            </Form.Item></Col>
            <Col span={8}><Form.Item label="Filing Date" name="filingDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Next Hearing" name="nextHearingDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>

          <Divider plain>Client & Assignment</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Client" name="clientId" rules={[{ required: true }]}>
              <Select showSearch placeholder="Select client" optionFilterProp="label"
                options={clients.map(c => ({ value: c.id, label: c.type === 'COMPANY' ? c.companyName : `${c.firstName} ${c.lastName}` }))} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Lead Attorney" name="leadAttorneyId">
              <Select showSearch placeholder="Select attorney" optionFilterProp="label" allowClear
                options={attorneys.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))} />
            </Form.Item></Col>
          </Row>

          <Divider plain>Court Information</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Court Name" name="courtName"><Input placeholder="Court name" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Court Case Number" name="courtCaseNo"><Input placeholder="Court case number" /></Form.Item></Col>
          </Row>

          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Create Case</Button>
            <Button onClick={() => router.push('/cases')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
