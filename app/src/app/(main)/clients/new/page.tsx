'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Select, Row, Col, Button, Space, Divider, message } from 'antd';
import PageHeader from '@/components/shared/PageHeader';
import { clientsApi } from '@/lib/api/clients';

const { TextArea } = Input;

export default function NewClientPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await clientsApi.createClient(values as Partial<import('@/types').Client>);
      message.success('Client created successfully!');
      router.push('/clients');
    } catch { message.error('Failed to create client'); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Add New Client" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients', href: '/clients' }, { label: 'New Client' }]} />
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="middle">
          <Divider plain>Personal Information</Divider>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="Client Type" name="type" initialValue="INDIVIDUAL" rules={[{ required: true }]}>
              <Select options={[{ value: 'INDIVIDUAL', label: 'Individual' }, { value: 'COMPANY', label: 'Company' }]} />
            </Form.Item></Col>
            <Col span={9}><Form.Item label="First Name" name="firstName" rules={[{ required: true, message: 'Required' }]}><Input placeholder="First name" /></Form.Item></Col>
            <Col span={9}><Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Required' }]}><Input placeholder="Last name" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Company Name" name="companyName"><Input placeholder="Company name (if applicable)" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Title / Position" name="title"><Input placeholder="e.g. CEO, Manager" /></Form.Item></Col>
          </Row>

          <Divider plain>Contact Information</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}><Input placeholder="client@email.com" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}><Input placeholder="(555) 000-0000" /></Form.Item></Col>
          </Row>
          <Row gutter={16}><Col span={24}><Form.Item label="Address" name="address"><Input placeholder="Street address" /></Form.Item></Col></Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="City" name="city"><Input placeholder="City" /></Form.Item></Col>
            <Col span={8}><Form.Item label="State" name="state"><Input placeholder="State" /></Form.Item></Col>
            <Col span={8}><Form.Item label="ZIP Code" name="zipCode"><Input placeholder="ZIP" /></Form.Item></Col>
          </Row>

          <Divider plain>Additional Information</Divider>
          <Form.Item label="Notes" name="notes"><TextArea rows={4} placeholder="Any additional notes..." /></Form.Item>
          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Create Client</Button>
            <Button onClick={() => router.push('/clients')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
