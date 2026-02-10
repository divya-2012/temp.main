'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Input, Space, Tag, Dropdown, Modal, Form, Select, message, Row, Col } from 'antd';
import {
  PlusOutlined, SearchOutlined, MoreOutlined, FileTextOutlined,
  EyeOutlined, DeleteOutlined, UploadOutlined, EditOutlined,
  RobotOutlined, FileAddOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { documentsApi } from '@/lib/api/documents';
import { formatDate, formatFileSize } from '@/utils/formatters';
import type { QueryParams, Document as DocType } from '@/types';

const iconColors: Record<string, string> = {
  'application/pdf': '#DC2626',
  'text/html': '#2563EB',
  'application/msword': '#2563EB',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '#2563EB',
};

const docTemplates = [
  { key: 'engagement-letter', label: 'Engagement Letter', icon: <FileTextOutlined /> },
  { key: 'motion', label: 'Motion / Pleading', icon: <FileTextOutlined /> },
  { key: 'contract', label: 'Contract / Agreement', icon: <FileTextOutlined /> },
  { key: 'memo', label: 'Legal Memorandum', icon: <FileTextOutlined /> },
  { key: 'letter', label: 'General Letter', icon: <FileTextOutlined /> },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params: QueryParams = { page, limit: 20 };
      if (search) params.search = search;
      const res = await documentsApi.getDocuments(params);
      setDocuments(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setDocuments([]); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (values: Record<string, unknown>) => {
    setUploading(true);
    try {
      await documentsApi.createDocument({
        name: values.name as string,
        originalName: values.name as string,
        mimeType: 'application/pdf',
        size: 0,
        storagePath: `uploads/${Date.now()}-${(values.name as string).toLowerCase().replace(/\s+/g, '-')}`,
        caseId: values.caseId || null,
      });
      message.success('Document created');
      setUploadOpen(false);
      uploadForm.resetFields();
      fetchDocuments();
    } catch { message.error('Failed to create document'); } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentsApi.deleteDocument(id);
      message.success('Document deleted');
      fetchDocuments();
    } catch { message.error('Failed to delete document'); }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string, r: DocType) => (
      <Space>
        <FileTextOutlined style={{ color: iconColors[r.mimeType] || '#6B7280', fontSize: 16 }} />
        <span style={{ fontWeight: 500 }}>{n}</span>
      </Space>
    )},
    { title: 'Case', key: 'case', width: 180, render: (_: unknown, r: DocType) =>
      r.case ? <Tag color="blue">{r.case.caseNumber}</Tag> : <Tag>—</Tag>
    },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 100, render: (s: number) => formatFileSize(s) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (s: string) => (
      <Tag color={s === 'ANALYZED' ? 'green' : s === 'PROCESSING' ? 'blue' : s === 'ERROR' ? 'red' : 'default'}>{s}</Tag>
    )},
    { title: 'Uploaded By', key: 'uploadedBy', width: 130, render: (_: unknown, r: DocType) =>
      r.uploadedBy ? `${r.uploadedBy.firstName} ${r.uploadedBy.lastName}` : '—'
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (d: string) => formatDate(d) },
    {
      title: '', key: 'actions', width: 48,
      render: (_: unknown, record: DocType) => (
        <Dropdown menu={{ items: [
          { key: 'edit', label: 'Open in Editor', icon: <EditOutlined />, onClick: () => router.push(`/documents/editor?id=${record.id}`) },
          { key: 'view', label: 'View Details', icon: <EyeOutlined /> },
          { type: 'divider' as const },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) },
        ] }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Documents" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents' }]}
        extra={
          <Space>
            <Dropdown menu={{ items: docTemplates.map(t => ({
              key: t.key, label: t.label, icon: t.icon,
              onClick: () => router.push(`/documents/editor?template=${t.key}`),
            })) }} trigger={['click']}>
              <Button icon={<RobotOutlined />}>AI Document Maker</Button>
            </Dropdown>
            <Button icon={<EditOutlined />} onClick={() => router.push('/documents/editor')}>New Document</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>Upload</Button>
          </Space>
        }
      />

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />} placeholder="Search documents..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 400 }} allowClear />
          <Space>
            <Tag>{total} documents</Tag>
          </Space>
        </div>
        <Table loading={loading} dataSource={documents} columns={columns} rowKey="id"
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          onRow={(record) => ({ onDoubleClick: () => router.push(`/documents/editor?id=${record.id}`) })}
        />
      </Card>

      <Modal title="Upload Document" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Form.Item label="Document Name" name="name" rules={[{ required: true }]}><Input placeholder="Document name" /></Form.Item>
          <Form.Item label="Case (optional)" name="caseId"><Input placeholder="Case ID" /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<UploadOutlined />} loading={uploading}>Upload</Button>
            <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
