'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Typography, Spin, Tag, Empty, Select, Tabs, Divider, Row, Col } from 'antd';
import {
  SendOutlined, SearchOutlined, RobotOutlined, BookOutlined,
  BankOutlined, GlobalOutlined, HistoryOutlined, ClearOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { researchApi } from '@/lib/api/research';

const { Text, Paragraph, Title } = Typography;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: string;
}

const jurisdictions = [
  { value: 'all', label: 'All Jurisdictions' },
  { value: 'federal', label: 'Federal' },
  { value: 'california', label: 'California' },
  { value: 'new-york', label: 'New York' },
  { value: 'texas', label: 'Texas' },
  { value: 'florida', label: 'Florida' },
  { value: 'illinois', label: 'Illinois' },
];

const researchModes = [
  { key: 'general', label: 'General', icon: <SearchOutlined />, description: 'Comprehensive legal research' },
  { key: 'case-law', label: 'Case Law', icon: <BankOutlined />, description: 'Search case precedents' },
  { key: 'statute', label: 'Statutory', icon: <BookOutlined />, description: 'Statute & regulation analysis' },
];

const suggestedQueries = [
  'What are the elements of negligence?',
  'Explain the statute of limitations for personal injury',
  'What constitutes breach of fiduciary duty?',
  'How does comparative negligence work?',
  'Explain the parol evidence rule',
  'What are the requirements for a valid will?',
];

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState('general');
  const [jurisdiction, setJurisdiction] = useState('all');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date(), mode };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await researchApi.chat({ message: q, history, jurisdiction, mode });
      const data = res.data.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.message || 'No results found.',
        timestamp: new Date(),
        mode,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, the research service is unavailable. Please try again.',
        timestamp: new Date(),
      }]);
    } finally { setLoading(false); }
  };

  const modeColor = mode === 'case-law' ? '#DC2626' : mode === 'statute' ? '#D97706' : '#2563EB';

  return (
    <div>
      <PageHeader title="Legal Research" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Research' }]}
        extra={
          <Space>
            <Select value={jurisdiction} onChange={setJurisdiction} style={{ width: 160 }}
              options={jurisdictions} />
            <Button icon={<ClearOutlined />} onClick={() => setMessages([])} disabled={messages.length === 0}>Clear</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          <Card style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}>

            {/* Mode Selector */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
              {researchModes.map(m => (
                <Button key={m.key} type={mode === m.key ? 'primary' : 'default'} icon={m.icon}
                  onClick={() => setMode(m.key)} size="small"
                  style={mode === m.key ? {} : { borderColor: '#D1D5DB' }}>
                  {m.label}
                </Button>
              ))}
              <Tag color={modeColor} style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                {jurisdiction === 'all' ? 'All Jurisdictions' : jurisdiction.charAt(0).toUpperCase() + jurisdiction.slice(1)}
              </Tag>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <RobotOutlined style={{ fontSize: 52, color: modeColor, marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#374151' }}>AI Legal Research Assistant</Title>
                  <Paragraph type="secondary" style={{ maxWidth: 500, margin: '0 auto 24px' }}>
                    Ask any legal question. I'll research case law, statutes, and regulations to provide comprehensive analysis with citations.
                  </Paragraph>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
                    {suggestedQueries.map(sq => (
                      <Button key={sq} size="small" style={{ borderRadius: 16 }} onClick={() => handleSend(sq)}>
                        {sq}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 16, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.role === 'assistant' && msg.mode && (
                      <Tag color={msg.mode === 'case-law' ? 'red' : msg.mode === 'statute' ? 'orange' : 'blue'} style={{ marginBottom: 4, fontSize: 11 }}>
                        {msg.mode === 'case-law' ? 'Case Law' : msg.mode === 'statute' ? 'Statutory' : 'General'}
                      </Tag>
                    )}
                    <div style={{
                      display: 'inline-block', maxWidth: '85%', padding: '12px 16px', borderRadius: 12,
                      background: msg.role === 'user' ? '#2563EB' : '#F9FAFB',
                      color: msg.role === 'user' ? '#fff' : '#1F2933',
                      border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                      textAlign: 'left',
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6 }}>{msg.content}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div style={{ textAlign: 'left', marginBottom: 16 }}>
                  <div style={{ display: 'inline-block', padding: '12px 16px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Researching...</Text>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input size="large" placeholder={`Ask a ${mode === 'case-law' ? 'case law' : mode === 'statute' ? 'statutory' : 'legal research'} question...`}
                  value={query} onChange={(e) => setQuery(e.target.value)} onPressEnter={() => handleSend()} disabled={loading}
                  prefix={<SearchOutlined style={{ color: modeColor }} />} />
                <Button size="large" type="primary" icon={<SendOutlined />} onClick={() => handleSend()} loading={loading}
                  style={{ background: modeColor, borderColor: modeColor }} />
              </Space.Compact>
            </div>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={6}>
          <Card title="Research Modes" size="small">
            {researchModes.map(m => (
              <div key={m.key} style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <Space>
                  {m.icon}
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{m.label}</Text>
                    <br /><Text type="secondary" style={{ fontSize: 11 }}>{m.description}</Text>
                  </div>
                </Space>
              </div>
            ))}
          </Card>

          <Card title="Quick Topics" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {['Contract Law', 'Tort & Negligence', 'Employment Law', 'Intellectual Property', 'Real Estate', 'Criminal Law'].map(t => (
                <Button key={t} size="small" block style={{ textAlign: 'left' }} onClick={() => handleSend(`Give me an overview of ${t}`)}>
                  {t}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
