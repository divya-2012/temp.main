'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { Card, Tabs, Descriptions, Tag, Button, Space, Table, Spin, Empty, Typography, Avatar, Row, Col, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import StatusTag from '@/components/shared/StatusTag';
import { clientsApi } from '@/lib/api/clients';
import { formatDate, formatCurrency, getInitials } from '@/utils/formatters';
import type { Client, Case } from '@/types';

const { Text, Title } = Typography;

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<(Client & { cases?: Case[] }) | null>(null);

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientsApi.getClient(id);
      setClient(res.data.data);
    } catch { message.error('Failed to load client'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!client) return <Empty description="Client not found" />;

  const displayName = client.type === 'COMPANY' ? (client.companyName || '') : `${client.firstName || ''} ${client.lastName || ''}`.trim();

  return (
    <div>
      <PageHeader title={displayName} breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients', href: '/clients' }, { label: displayName }]}
        extra={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/clients')}>Back</Button><Button type="primary" icon={<EditOutlined />}>Edit</Button></Space>} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar size={64} style={{ backgroundColor: '#2563EB', fontSize: 24 }}>{getInitials(displayName)}</Avatar>
              <Title level={4} style={{ margin: '12px 0 4px' }}>{displayName}</Title>
              <Tag color={client.type === 'COMPANY' ? 'blue' : 'default'}>{client.type}</Tag>
            </div>
            <Descriptions column={1} size="small">
              {client.email && <Descriptions.Item label={<><MailOutlined /> Email</>}>{client.email}</Descriptions.Item>}
              {client.phone && <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>{client.phone}</Descriptions.Item>}
              {client.address && <Descriptions.Item label="Address">{client.address}</Descriptions.Item>}
              <Descriptions.Item label="Client Since">{formatDate(client.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="cases" items={[
            { key: 'cases', label: 'Cases', children: (
              <Card>
                {client.cases && client.cases.length > 0 ? (
                  <Table dataSource={client.cases} rowKey="id" pagination={false}
                    columns={[
                      { title: 'Case', dataIndex: 'title', key: 'title', render: (t: string, r: Case) => <a onClick={() => router.push(`/cases/${r.id}`)}>{t}<div style={{ fontSize: 12, color: '#6B7280' }}>{r.caseNumber}</div></a> },
                      { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s as 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'CLOSED' | 'ARCHIVED'} /> },
                      { title: 'Updated', dataIndex: 'updatedAt', key: 'updatedAt', render: (d: string) => formatDate(d) },
                    ]} />
                ) : <Empty description="No cases for this client" />}
              </Card>
            )},
            { key: 'overview', label: 'Overview', children: (
              <Card>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="First Name">{client.firstName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Last Name">{client.lastName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Company">{client.companyName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Type">{client.type}</Descriptions.Item>
                  <Descriptions.Item label="Created">{formatDate(client.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="Updated">{formatDate(client.updatedAt)}</Descriptions.Item>
                </Descriptions>
              </Card>
            )},
          ]} />
        </Col>
      </Row>
    </div>
  );
}
