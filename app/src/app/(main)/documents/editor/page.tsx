'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import {
  Card, Button, Space, Typography, Input, Select, Row, Col,
  Divider, Spin, message, Tag, Tooltip, Modal, Form, Dropdown
} from 'antd';
import {
  SaveOutlined, FileTextOutlined, PrinterOutlined, DownloadOutlined,
  BoldOutlined, ItalicOutlined, UnderlineOutlined, OrderedListOutlined,
  UnorderedListOutlined, AlignLeftOutlined, AlignCenterOutlined,
  AlignRightOutlined, ArrowLeftOutlined, RobotOutlined, PlusOutlined,
  UndoOutlined, RedoOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { documentsApi } from '@/lib/api/documents';

const { Text, Title } = Typography;

function DocumentEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  const templateType = searchParams.get('template');
  const caseId = searchParams.get('caseId');

  const [loading, setLoading] = useState(false);
  const [docName, setDocName] = useState('Untitled Document');
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm] = Form.useForm();
  const [generating, setGenerating] = useState(false);

  // Load existing document or template
  useEffect(() => {
    if (docId) {
      setLoading(true);
      documentsApi.getDocument(docId).then(res => {
        const doc = res.data.data;
        setDocName(doc.name?.replace(/\.html$/, '') || 'Document');
        // If the document has stored content, we'd load it
        // For now, show the AI summary or placeholder
        if (editorRef.current) {
          editorRef.current.innerHTML = doc.aiSummary
            ? `<h1>${doc.name}</h1><p>${doc.aiSummary}</p>`
            : `<h1>${doc.name}</h1><p>Document content would be loaded from storage.</p>`;
        }
      }).catch(() => message.error('Failed to load document')).finally(() => setLoading(false));
    } else if (templateType) {
      setDocName(`New ${templateType.charAt(0).toUpperCase() + templateType.slice(1)}`);
      handleGenerate(templateType, `New ${templateType}`, caseId || undefined);
    }
  }, [docId, templateType, caseId]);

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const content = editorRef.current.innerHTML;
      if (docId) {
        await documentsApi.updateDocument(docId, {
          name: docName.endsWith('.html') ? docName : `${docName}.html`,
          aiSummary: content.substring(0, 500).replace(/<[^>]*>/g, ''),
        });
      } else {
        await documentsApi.generateDocument({
          type: 'custom',
          title: docName,
          caseId: caseId || undefined,
          content,
        });
      }
      message.success('Document saved');
    } catch { message.error('Failed to save document'); } finally { setSaving(false); }
  };

  const handleGenerate = async (type?: string, title?: string, forCaseId?: string) => {
    if (!editorRef.current) return;
    setGenerating(true);
    try {
      const res = await documentsApi.generateDocument({
        type: type || generateForm.getFieldValue('type') || 'letter',
        title: title || generateForm.getFieldValue('title') || docName,
        caseId: forCaseId || generateForm.getFieldValue('caseId') || caseId || undefined,
      });
      const generatedContent = res.data.data?.content;
      if (generatedContent && editorRef.current) {
        editorRef.current.innerHTML = generatedContent;
        setDocName(title || generateForm.getFieldValue('title') || docName);
      }
      setGenerateOpen(false);
      generateForm.resetFields();
    } catch { message.error('Failed to generate document'); } finally { setGenerating(false); }
  };

  const handlePrint = () => {
    if (!editorRef.current) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${docName}</title><style>body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }</style></head><body>${editorRef.current.innerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportHTML = () => {
    if (!editorRef.current) return;
    const blob = new Blob([
      `<html><head><title>${docName}</title><style>body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }</style></head><body>${editorRef.current.innerHTML}</body></html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Document Editor" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents', href: '/documents' }, { label: docName }]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/documents')}>Back</Button>
            <Button icon={<RobotOutlined />} onClick={() => setGenerateOpen(true)}>AI Generate</Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportHTML}>Export</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>Save</Button>
          </Space>
        }
      />

      <Card>
        {/* Document Title */}
        <Input value={docName} onChange={e => setDocName(e.target.value)} variant="borderless"
          style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, padding: 0 }} placeholder="Document title..." />

        <Divider style={{ margin: '8px 0' }} />

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 0', borderBottom: '1px solid #E5E7EB', marginBottom: 16 }}>
          <Tooltip title="Undo"><Button type="text" size="small" icon={<UndoOutlined />} onClick={() => execCommand('undo')} /></Tooltip>
          <Tooltip title="Redo"><Button type="text" size="small" icon={<RedoOutlined />} onClick={() => execCommand('redo')} /></Tooltip>
          <Divider type="vertical" />
          <Select defaultValue="p" size="small" style={{ width: 120 }} onChange={(v) => execCommand('formatBlock', v)}
            options={[
              { value: 'p', label: 'Normal' },
              { value: 'h1', label: 'Heading 1' },
              { value: 'h2', label: 'Heading 2' },
              { value: 'h3', label: 'Heading 3' },
            ]}
          />
          <Divider type="vertical" />
          <Tooltip title="Bold"><Button type="text" size="small" icon={<BoldOutlined />} onClick={() => execCommand('bold')} /></Tooltip>
          <Tooltip title="Italic"><Button type="text" size="small" icon={<ItalicOutlined />} onClick={() => execCommand('italic')} /></Tooltip>
          <Tooltip title="Underline"><Button type="text" size="small" icon={<UnderlineOutlined />} onClick={() => execCommand('underline')} /></Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Align Left"><Button type="text" size="small" icon={<AlignLeftOutlined />} onClick={() => execCommand('justifyLeft')} /></Tooltip>
          <Tooltip title="Align Center"><Button type="text" size="small" icon={<AlignCenterOutlined />} onClick={() => execCommand('justifyCenter')} /></Tooltip>
          <Tooltip title="Align Right"><Button type="text" size="small" icon={<AlignRightOutlined />} onClick={() => execCommand('justifyRight')} /></Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Bullet List"><Button type="text" size="small" icon={<UnorderedListOutlined />} onClick={() => execCommand('insertUnorderedList')} /></Tooltip>
          <Tooltip title="Numbered List"><Button type="text" size="small" icon={<OrderedListOutlined />} onClick={() => execCommand('insertOrderedList')} /></Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Insert Line"><Button type="text" size="small" onClick={() => execCommand('insertHorizontalRule')}>—</Button></Tooltip>
        </div>

        {/* Editor Area */}
        {loading ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div> : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={{
              minHeight: 600,
              padding: '24px 40px',
              fontFamily: "'Times New Roman', serif",
              fontSize: 14,
              lineHeight: 1.8,
              border: '1px solid #E5E7EB',
              borderRadius: 4,
              outline: 'none',
              background: '#FEFEFE',
            }}
            dangerouslySetInnerHTML={{ __html: '<p>Start typing or use AI Generate to create a document...</p>' }}
          />
        )}
      </Card>

      {/* AI Generate Modal */}
      <Modal title="AI Document Generator" open={generateOpen} onCancel={() => setGenerateOpen(false)} footer={null} width={500}>
        <Form form={generateForm} layout="vertical" onFinish={() => handleGenerate()}>
          <Form.Item label="Document Type" name="type" rules={[{ required: true }]}>
            <Select placeholder="Select template type" options={[
              { value: 'engagement-letter', label: 'Engagement Letter' },
              { value: 'motion', label: 'Motion / Pleading' },
              { value: 'contract', label: 'Contract / Agreement' },
              { value: 'memo', label: 'Legal Memorandum' },
              { value: 'letter', label: 'General Letter' },
            ]} />
          </Form.Item>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input placeholder="Document title" /></Form.Item>
          <Form.Item label="Case ID (optional)" name="caseId"><Input placeholder="Link to a case" /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<RobotOutlined />} loading={generating}>Generate with AI</Button>
            <Button onClick={() => setGenerateOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

export default function DocumentEditorPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>}>
      <DocumentEditorContent />
    </Suspense>
  );
}
