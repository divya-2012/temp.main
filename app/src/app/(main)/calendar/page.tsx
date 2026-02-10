'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Modal, Form, Input, Select, DatePicker, Row, Col,
  Tag, List, Typography, Space, Spin, Empty, message, Badge, Tooltip, Popconfirm
} from 'antd';
import {
  PlusOutlined, CalendarOutlined, LeftOutlined, RightOutlined,
  EditOutlined, DeleteOutlined, EnvironmentOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { calendarApi } from '@/lib/api/calendar';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types';

const { Text, Paragraph, Title } = Typography;

const typeColors: Record<string, string> = {
  HEARING: '#DC2626', MEETING: '#2563EB', DEADLINE: '#D97706',
  TASK: '#16A34A', COURT_DATE: '#DC2626', REMINDER: '#8B5CF6', OTHER: '#6B7280',
};

const typeLabels: Record<string, string> = {
  HEARING: 'Hearing', MEETING: 'Meeting', DEADLINE: 'Deadline',
  TASK: 'Task', COURT_DATE: 'Court Date', REMINDER: 'Reminder', OTHER: 'Other',
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = currentMonth.startOf('month').subtract(7, 'day').toISOString();
      const endDate = currentMonth.endOf('month').add(7, 'day').toISOString();
      const res = await calendarApi.getEvents({ startDate, endDate });
      setEvents(res.data.data || []);
    } catch { setEvents([]); } finally { setLoading(false); }
  }, [currentMonth]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Partial<CalendarEvent> = {
        title: values.title as string,
        description: values.description as string,
        type: values.type as CalendarEvent['type'],
        startTime: (values.startTime as dayjs.Dayjs).toISOString(),
        endTime: values.endTime ? (values.endTime as dayjs.Dayjs).toISOString() : (values.startTime as dayjs.Dayjs).add(1, 'hour').toISOString(),
        location: values.location as string,
      };

      if (editingEvent) {
        await calendarApi.updateEvent(editingEvent.id, payload);
        message.success('Event updated');
      } else {
        await calendarApi.createEvent(payload);
        message.success('Event created');
      }
      setModalOpen(false);
      setEditingEvent(null);
      form.resetFields();
      fetchEvents();
    } catch { message.error('Failed to save event'); } finally { setSaving(false); }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await calendarApi.deleteEvent(eventId);
      message.success('Event deleted');
      setDetailEvent(null);
      fetchEvents();
    } catch { message.error('Failed to delete event'); }
  };

  const openNewEvent = (date?: dayjs.Dayjs) => {
    setEditingEvent(null);
    form.resetFields();
    if (date) form.setFieldsValue({ startTime: date.hour(9), endTime: date.hour(10) });
    setModalOpen(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.setFieldsValue({
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: dayjs(event.startTime),
      endTime: event.endTime ? dayjs(event.endTime) : null,
      location: event.location,
    });
    setModalOpen(true);
    setDetailEvent(null);
  };

  // Build calendar grid
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day(); // 0=Sun
  const daysInMonth = currentMonth.daysInMonth();
  const today = dayjs();

  const calendarDays: Array<{ date: dayjs.Dayjs; inMonth: boolean }> = [];
  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    calendarDays.push({ date: startOfMonth.subtract(i + 1, 'day'), inMonth: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ date: currentMonth.date(i), inMonth: true });
  }
  // Next month padding
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ date: endOfMonth.add(i, 'day'), inMonth: false });
  }

  const getEventsForDate = (date: dayjs.Dayjs) =>
    events.filter(e => dayjs(e.startTime).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'));

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const upcomingEvents = events
    .filter(e => dayjs(e.startTime).isAfter(today))
    .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));

  return (
    <div>
      <PageHeader title="Calendar" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calendar' }]}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openNewEvent()}>New Event</Button>} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}>
          <Card
            title={
              <Space>
                <Button icon={<LeftOutlined />} size="small" onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))} />
                <Text strong style={{ fontSize: 16, minWidth: 160, textAlign: 'center', display: 'inline-block' }}>
                  {currentMonth.format('MMMM YYYY')}
                </Text>
                <Button icon={<RightOutlined />} size="small" onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))} />
                <Button size="small" onClick={() => setCurrentMonth(today)}>Today</Button>
              </Space>
            }
          >
            {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div> : (
              <>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB', marginBottom: 2 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontWeight: 600, fontSize: 12, color: '#6B7280' }}>{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDate(day.date);
                    const isToday = day.date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
                    const isSelected = selectedDate?.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD');

                    return (
                      <div key={idx}
                        onClick={() => setSelectedDate(day.date)}
                        onDoubleClick={() => openNewEvent(day.date)}
                        style={{
                          minHeight: 80, padding: 4, cursor: 'pointer',
                          border: isSelected ? '2px solid #2563EB' : '1px solid #F3F4F6',
                          borderRadius: 4,
                          background: isToday ? '#EFF6FF' : isSelected ? '#F0F7FF' : day.inMonth ? '#fff' : '#FAFAFA',
                          opacity: day.inMonth ? 1 : 0.5,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#2563EB' : '#374151', marginBottom: 2 }}>
                          {day.date.date()}
                        </div>
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}
                            style={{
                              fontSize: 11, padding: '1px 4px', marginBottom: 1, borderRadius: 3, cursor: 'pointer',
                              background: typeColors[ev.type] || '#6B7280', color: '#fff',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <Text type="secondary" style={{ fontSize: 10 }}>+{dayEvents.length - 3} more</Text>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* Selected date events */}
          {selectedDate && (
            <Card title={`Events on ${selectedDate.format('MMMM D, YYYY')}`} size="small" style={{ marginTop: 16 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openNewEvent(selectedDate)}>Add</Button>}>
              {selectedDateEvents.length > 0 ? (
                <List dataSource={selectedDateEvents} renderItem={ev => (
                  <List.Item actions={[
                    <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => openEditEvent(ev)} />,
                    <Popconfirm key="del" title="Delete this event?" onConfirm={() => handleDelete(ev.id)}>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}>
                    <List.Item.Meta
                      avatar={<Tag color={typeColors[ev.type]}>{typeLabels[ev.type]}</Tag>}
                      title={ev.title}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {dayjs(ev.startTime).format('h:mm A')}{ev.endTime ? ` - ${dayjs(ev.endTime).format('h:mm A')}` : ''}
                          </Text>
                          {ev.location && <Text type="secondary" style={{ fontSize: 12 }}><EnvironmentOutlined /> {ev.location}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )} />
              ) : <Empty description="No events on this date" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={7}>
          <Card title="Upcoming Events" size="small">
            {upcomingEvents.length > 0 ? (
              <List size="small" dataSource={upcomingEvents.slice(0, 10)} renderItem={ev => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => setDetailEvent(ev)}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: 13 }}>{ev.title}</Text>
                      <Tag color={typeColors[ev.type]} style={{ fontSize: 10 }}>{typeLabels[ev.type]}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {dayjs(ev.startTime).format('MMM D, h:mm A')}
                    </Text>
                    {ev.location && <><br /><Text type="secondary" style={{ fontSize: 11 }}><EnvironmentOutlined /> {ev.location}</Text></>}
                  </div>
                </List.Item>
              )} />
            ) : <Empty description="No upcoming events" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>

          <Card title="Event Types" size="small" style={{ marginTop: 16 }}>
            {Object.entries(typeLabels).map(([k, v]) => {
              const count = events.filter(e => e.type === k).length;
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <Space><div style={{ width: 12, height: 12, borderRadius: 2, background: typeColors[k] }} /><Text style={{ fontSize: 12 }}>{v}</Text></Space>
                  <Badge count={count} style={{ backgroundColor: typeColors[k] }} />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Event Modal */}
      <Modal title={editingEvent ? 'Edit Event' : 'New Event'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditingEvent(null); }} footer={null} width={550}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input placeholder="Event title" /></Form.Item>
          <Form.Item label="Type" name="type" initialValue="MEETING">
            <Select options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Start" name="startTime" rules={[{ required: true }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="End" name="endTime"><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="Location" name="location"><Input prefix={<EnvironmentOutlined />} placeholder="Location" /></Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={2} placeholder="Event details..." /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>{editingEvent ? 'Update' : 'Create'}</Button>
            <Button onClick={() => { setModalOpen(false); setEditingEvent(null); }}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      {/* Event Detail Modal */}
      <Modal title="Event Details" open={!!detailEvent} onCancel={() => setDetailEvent(null)}
        footer={detailEvent ? [
          <Button key="edit" icon={<EditOutlined />} onClick={() => openEditEvent(detailEvent)}>Edit</Button>,
          <Popconfirm key="del" title="Delete this event?" onConfirm={() => handleDelete(detailEvent.id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>,
        ] : []}>
        {detailEvent && (
          <div>
            <Tag color={typeColors[detailEvent.type]} style={{ marginBottom: 12 }}>{typeLabels[detailEvent.type]}</Tag>
            <Title level={4} style={{ margin: 0 }}>{detailEvent.title}</Title>
            <Space direction="vertical" style={{ marginTop: 12, width: '100%' }}>
              <Text><ClockCircleOutlined style={{ marginRight: 8 }} />{dayjs(detailEvent.startTime).format('dddd, MMMM D, YYYY • h:mm A')}</Text>
              {detailEvent.endTime && <Text type="secondary" style={{ marginLeft: 22 }}>to {dayjs(detailEvent.endTime).format('h:mm A')}</Text>}
              {detailEvent.location && <Text><EnvironmentOutlined style={{ marginRight: 8 }} />{detailEvent.location}</Text>}
              {detailEvent.description && <Paragraph style={{ marginTop: 8 }}>{detailEvent.description}</Paragraph>}
              {detailEvent.case && <Tag color="blue">{detailEvent.case.caseNumber}: {detailEvent.case.title}</Tag>}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
