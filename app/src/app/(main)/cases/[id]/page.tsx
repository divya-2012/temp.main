'use client';

import React, { useEffect, useState, useCallback, useRef, use } from 'react';
import {
  Card, Tabs, Row, Col, Descriptions, Tag, Button, Space, Timeline, Table,
  Spin, Empty, Typography, message, Modal, Form, Input, Select, DatePicker,
  Upload, Drawer, List, Badge, Tooltip, Divider
} from 'antd';
import {
  EditOutlined, ArrowLeftOutlined, RobotOutlined, SendOutlined,
  FileTextOutlined, UploadOutlined, PlusOutlined, EyeOutlined,
  DeleteOutlined, SaveOutlined, CloseOutlined, MessageOutlined,
  CalendarOutlined, DollarOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import PageHeader from '@/components/shared/PageHeader';
import StatusTag from '@/components/shared/StatusTag';
import { casesApi } from '@/lib/api/cases';
import { documentsApi } from '@/lib/api/documents';
import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '@/utils/formatters';
import type { Case, CaseAssignment, Document as DocType } from '@/types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CaseDetail extends Case {
  timeline?: Array<{ id: string; title: string; createdAt: string; eventType: string; description?: string; user?: { firstName: string; lastName: string } }>;
  documents?: DocType[];
  timeEntries?: Array<{ id: string; description: string; hours: number; rate: number; amount: number; date: string; user?: { firstName: string; lastName: string } }>;
  notes?: Array<{ id: string; content: string; createdAt: string; author?: { firstName: string; lastName: string } }>;
  tasks?: Array<{ id: string; title: string; status: string; priority: string; dueDate?: string; assignee?: { firstName: string; lastName: string } }>;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; timestamp: Date }

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Upload document state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      setLoading(true);
      const res = await casesApi.getCase(id);
      setCaseData(res.data.data);
    } catch { message.error('Failed to load case'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // === EDIT CASE ===
  const openEdit = () => {
    if (!caseData) return;
    editForm.setFieldsValue({
      title: caseData.title,
      description: caseData.description,
      status: caseData.status,
      priority: caseData.priority,
      practiceArea: caseData.practiceArea,
      courtName: caseData.courtName,
      courtCaseNo: caseData.courtCaseNo,
      filingDate: caseData.filingDate ? dayjs(caseData.filingDate) : null,
      nextHearingDate: caseData.nextHearingDate ? dayjs(caseData.nextHearingDate) : null,
    });
    setEditOpen(true);
  };

  const handleEditSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        filingDate: values.filingDate ? (values.filingDate as dayjs.Dayjs).toISOString() : undefined,
        nextHearingDate: values.nextHearingDate ? (values.nextHearingDate as dayjs.Dayjs).toISOString() : undefined,
      };
      await casesApi.updateCase(id, payload as Partial<Case>);
      message.success('Case updated successfully');
      setEditOpen(false);
      fetchCase();
    } catch { message.error('Failed to update case'); } finally { setSaving(false); }
  };

  // === CASE CHATBOT ===
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data?.message || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, the AI assistant is unavailable right now.',
        timestamp: new Date(),
      }]);
    } finally { setChatLoading(false); }
  };

  // === UPLOAD DOCUMENT ===
  const handleUploadDocument = async (values: Record<string, unknown>) => {
    setUploading(true);
    try {
      await documentsApi.createDocument({
        name: values.name as string,
        originalName: values.name as string,
        mimeType: 'application/pdf',
        size: 0,
        storagePath: `uploads/${Date.now()}-${(values.name as string).toLowerCase().replace(/\s+/g, '-')}`,
        caseId: id,
      });
      message.success('Document added to case');
      setUploadOpen(false);
      uploadForm.resetFields();
      fetchCase();
    } catch { message.error('Failed to add document'); } finally { setUploading(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!caseData) return <Empty description="Case not found" />;

  const client = caseData.client;
  const clientName = client ? (client.type === 'COMPANY' ? client.companyName : `${client.firstName} ${client.lastName}`) : '—';

  const timelineColors: Record<string, string> = {
    CASE_CREATED: 'green', STATUS_CHANGED: 'blue', DOCUMENT_ADDED: 'cyan',
    NOTE_ADDED: 'purple', HEARING_SCHEDULED: 'red', OTHER: 'gray',
  };

  return (
    <div>
      <PageHeader
        title={caseData.title}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases', href: '/cases' }, { label: caseData.caseNumber }]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/cases')}>Back</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={openEdit}>Edit Case</Button>
            <Badge count={chatMessages.length} size="small">
              <Button icon={<RobotOutlined />} onClick={() => setChatOpen(true)} style={{ borderColor: '#2563EB', color: '#2563EB' }}>AI Chat</Button>
            </Badge>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="overview" items={[
            /* ---- OVERVIEW TAB ---- */
            { key: 'overview', label: 'Overview', children: (
              <Card>
                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                  <Descriptions.Item label="Case Number"><Text copyable>{caseData.caseNumber}</Text></Descriptions.Item>
                  <Descriptions.Item label="Status"><StatusTag status={caseData.status} /></Descriptions.Item>
                  <Descriptions.Item label="Priority"><Tag color={caseData.priority === 'URGENT' ? 'red' : caseData.priority === 'HIGH' ? 'orange' : caseData.priority === 'LOW' ? 'default' : 'blue'}>{caseData.priority}</Tag></Descriptions.Item>
                  <Descriptions.Item label="Practice Area">{caseData.practiceArea || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Client"><Text strong>{clientName}</Text></Descriptions.Item>
                  <Descriptions.Item label="Court">{caseData.courtName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Court Case #">{caseData.courtCaseNo || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Filing Date">{caseData.filingDate ? formatDate(caseData.filingDate) : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Next Hearing">
                    {caseData.nextHearingDate ? (
                      <Space><CalendarOutlined style={{ color: '#DC2626' }} /><Text>{formatDate(caseData.nextHearingDate)}</Text></Space>
                    ) : '—'}
                  </Descriptions.Item>
                </Descriptions>
                {caseData.description && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary" strong>Description</Text>
                    <Paragraph style={{ marginTop: 4 }}>{caseData.description}</Paragraph>
                  </div>
                )}
              </Card>
            )},

            /* ---- DOCUMENTS TAB ---- */
            { key: 'documents', label: <span><FileTextOutlined /> Documents ({caseData.documents?.length || 0})</span>, children: (
              <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>Add Document</Button>}>
                {caseData.documents && caseData.documents.length > 0 ? (
                  <Table dataSource={caseData.documents} rowKey="id" pagination={false}
                    columns={[
                      { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string, r: DocType) => (
                        <Space>
                          <FileTextOutlined style={{ color: r.mimeType?.includes('pdf') ? '#DC2626' : r.mimeType?.includes('html') ? '#2563EB' : '#6B7280' }} />
                          <Text strong>{n}</Text>
                        </Space>
                      )},
                      { title: 'Size', dataIndex: 'size', key: 'size', width: 100, render: (s: number) => formatFileSize(s) },
                      { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (s: string) => (
                        <Tag color={s === 'ANALYZED' ? 'green' : s === 'PROCESSING' ? 'blue' : s === 'ERROR' ? 'red' : 'default'}>{s}</Tag>
                      )},
                      { title: 'Uploaded', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (d: string) => formatDate(d) },
                      { title: 'Uploaded By', key: 'uploadedBy', width: 130, render: (_: unknown, r: DocType) => r.uploadedBy ? `${r.uploadedBy.firstName} ${r.uploadedBy.lastName}` : '—' },
                      { title: '', key: 'actions', width: 80, render: (_: unknown, r: DocType) => (
                        <Space>
                          <Tooltip title="View"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/documents/editor?id=${r.id}`)} /></Tooltip>
                          <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={async () => {
                            await documentsApi.deleteDocument(r.id); message.success('Deleted'); fetchCase();
                          }} /></Tooltip>
                        </Space>
                      )},
                    ]}
                  />
                ) : (
                  <Empty description="No documents for this case" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>Add First Document</Button>
                  </Empty>
                )}
              </Card>
            )},

            /* ---- TIMELINE TAB ---- */
            { key: 'timeline', label: <span><ClockCircleOutlined /> Timeline</span>, children: (
              <Card>
                {caseData.timeline && caseData.timeline.length > 0 ? (
                  <Timeline items={caseData.timeline.map(t => ({
                    color: timelineColors[t.eventType] || 'gray',
                    children: (
                      <div>
                        <Text strong>{t.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(t.createdAt)}
                          {t.user ? ` • ${t.user.firstName} ${t.user.lastName}` : ''}
                        </Text>
                        {t.description && <Paragraph style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{t.description}</Paragraph>}
                      </div>
                    ),
                  }))} />
                ) : <Empty description="No timeline events" />}
              </Card>
            )},

            /* ---- BILLING TAB ---- */
            { key: 'billing', label: <span><DollarOutlined /> Billing</span>, children: (
              <Card>
                {caseData.timeEntries && caseData.timeEntries.length > 0 ? (
                  <>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={8}><Card size="small"><Text type="secondary">Total Hours</Text><div style={{ fontSize: 24, fontWeight: 600 }}>{caseData.timeEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}</div></Card></Col>
                      <Col span={8}><Card size="small"><Text type="secondary">Total Billed</Text><div style={{ fontSize: 24, fontWeight: 600, color: '#16A34A' }}>{formatCurrency(caseData.timeEntries.reduce((s, e) => s + e.amount, 0))}</div></Card></Col>
                      <Col span={8}><Card size="small"><Text type="secondary">Entries</Text><div style={{ fontSize: 24, fontWeight: 600 }}>{caseData.timeEntries.length}</div></Card></Col>
                    </Row>
                    <Table dataSource={caseData.timeEntries} rowKey="id" pagination={false}
                      columns={[
                        { title: 'Description', dataIndex: 'description', key: 'description' },
                        { title: 'Attorney', key: 'user', width: 130, render: (_: unknown, r: { user?: { firstName: string; lastName: string } }) => r.user ? `${r.user.firstName} ${r.user.lastName}` : '—' },
                        { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 80 },
                        { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, render: (v: number) => formatCurrency(v) },
                        { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 110, render: (v: number) => <Text strong>{formatCurrency(v)}</Text> },
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 110, render: (d: string) => formatDate(d) },
                      ]}
                    />
                  </>
                ) : <Empty description="No billing entries" />}
              </Card>
            )},

            /* ---- NOTES TAB ---- */
            { key: 'notes', label: <span><MessageOutlined /> Notes ({caseData.notes?.length || 0})</span>, children: (
              <Card>
                {caseData.notes && caseData.notes.length > 0 ? (
                  <List dataSource={caseData.notes} renderItem={(note) => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text type="secondary" style={{ fontSize: 12 }}>
                          {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown'} • {formatDateTime(note.createdAt)}
                        </Text>}
                        description={<Paragraph style={{ margin: 0 }}>{note.content}</Paragraph>}
                      />
                    </List.Item>
                  )} />
                ) : <Empty description="No notes" />}
              </Card>
            )},
          ]} />
        </Col>

        {/* ---- RIGHT SIDEBAR ---- */}
        <Col xs={24} lg={8}>
          <Card title="Case Info" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Created">{formatDate(caseData.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Last Updated">{formatDate(caseData.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="Documents">{caseData.documents?.length || 0}</Descriptions.Item>
              <Descriptions.Item label="Time Entries">{caseData.timeEntries?.length || 0}</Descriptions.Item>
            </Descriptions>
          </Card>

          {caseData.assignments && caseData.assignments.length > 0 && (
            <Card title="Legal Team" size="small" style={{ marginTop: 16 }}>
              {caseData.assignments.map((a: CaseAssignment, i: number) => (
                <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{a.user?.firstName} {a.user?.lastName}</Text>
                  <Tag color={a.isLead ? 'blue' : 'default'}>{a.role.replace('_', ' ')}</Tag>
                </div>
              ))}
            </Card>
          )}

          <Card title="Quick Actions" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<RobotOutlined />} onClick={() => setChatOpen(true)}>Ask AI about this case</Button>
              <Button block icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>Add Document</Button>
              <Button block icon={<EditOutlined />} onClick={openEdit}>Edit Case Details</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ---- EDIT CASE MODAL ---- */}
      <Modal title="Edit Case" open={editOpen} onCancel={() => setEditOpen(false)} footer={null} width={700}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
          <Row gutter={16}>
            <Col span={16}><Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Status" name="status">
              <Select options={[
                { value: 'OPEN', label: 'Open' }, { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'ON_HOLD', label: 'On Hold' }, { value: 'CLOSED', label: 'Closed' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]} />
            </Form.Item></Col>
          </Row>
          <Form.Item label="Description" name="description"><TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Priority" name="priority">
              <Select options={[
                { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' },
              ]} />
            </Form.Item></Col>
            <Col span={8}><Form.Item label="Practice Area" name="practiceArea"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Court Name" name="courtName"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Court Case #" name="courtCaseNo"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Filing Date" name="filingDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Next Hearing" name="nextHearingDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Save Changes</Button>
            <Button onClick={() => setEditOpen(false)} icon={<CloseOutlined />}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      {/* ---- UPLOAD DOCUMENT MODAL ---- */}
      <Modal title="Add Document to Case" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadDocument}>
          <Form.Item label="Document Name" name="name" rules={[{ required: true }]}><Input placeholder="e.g., Motion to Dismiss.pdf" /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<UploadOutlined />} loading={uploading}>Add Document</Button>
            <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      {/* ---- AI CHAT DRAWER ---- */}
      <Drawer
        title={<Space><RobotOutlined style={{ color: '#2563EB' }} /><span>AI Case Assistant — {caseData.caseNumber}</span></Space>}
        placement="right"
        width={480}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        styles={{ body: { display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {chatMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#999' }}>
              <RobotOutlined style={{ fontSize: 40, marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>AI Case Assistant</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Ask me anything about <strong>{caseData.title}</strong></div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {['Give me a case summary', 'What documents are on file?', 'What is the case status?', 'Show billing summary'].map(q => (
                  <Button key={q} block size="small" style={{ textAlign: 'left' }}
                    onClick={() => { setChatInput(q); setTimeout(() => { const el = document.querySelector('.chat-send-btn') as HTMLButtonElement; el?.click(); }, 100); }}>
                    {q}
                  </Button>
                ))}
              </Space>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 12, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              <div style={{
                display: 'inline-block', maxWidth: '90%', padding: '10px 14px', borderRadius: 12,
                background: msg.role === 'user' ? '#2563EB' : '#F3F4F6',
                color: msg.role === 'user' ? '#fff' : '#1F2933',
                fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {dayjs(msg.timestamp).format('h:mm A')}
              </div>
            </div>
          ))}
          {chatLoading && <div style={{ textAlign: 'left', marginBottom: 12 }}><Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Analyzing case...</Text></div>}
          <div ref={chatBottomRef} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="Ask about this case..." value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onPressEnter={handleChatSend} disabled={chatLoading} />
            <Button className="chat-send-btn" type="primary" icon={<SendOutlined />} onClick={handleChatSend} loading={chatLoading} />
          </Space.Compact>
        </div>
      </Drawer>
    </div>
  );
}
