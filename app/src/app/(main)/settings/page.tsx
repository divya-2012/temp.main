'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Form, Input, Button, Table, Space, Tag, message, Spin, Descriptions } from 'antd';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi } from '@/lib/api/settings';
import { usersApi } from '@/lib/api/users';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [firmForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [firm, setFirm] = useState<Record<string, unknown> | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getSettings();
      const data = res.data.data;
      if (data.user) {
        profileForm.setFieldsValue(data.user);
      }
      if (data.firm) {
        setFirm(data.firm as Record<string, unknown>);
        firmForm.setFieldsValue(data.firm);
        const firmUsers = (data.firm as Record<string, unknown>).users as Array<Record<string, unknown>> || [];
        setUsers(firmUsers);
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [profileForm, firmForm]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleProfileSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(values);
      message.success('Profile updated');
      refreshUser();
    } catch { message.error('Failed to update profile'); } finally { setSaving(false); }
  };

  const handleFirmSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await settingsApi.updateFirm(values);
      message.success('Firm settings updated');
    } catch { message.error('Failed to update firm'); } finally { setSaving(false); }
  };

  const handlePasswordChange = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await settingsApi.changePassword({
        currentPassword: values.currentPassword as string,
        newPassword: values.newPassword as string,
      });
      message.success('Password changed');
      passwordForm.resetFields();
    } catch { message.error('Failed to change password'); } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const userColumns = [
    { title: 'Name', key: 'name', render: (_: unknown, r: Record<string, unknown>) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag>{r}</Tag> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (a: boolean) => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag> },
  ];

  return (
    <div>
      <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
      <Card>
        <Tabs defaultActiveKey="profile" tabPosition="left" items={[
          { key: 'profile', label: 'Profile', children: (
            <Form form={profileForm} layout="vertical" onFinish={handleProfileSave} style={{ maxWidth: 500 }}>
              <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
              <Form.Item label="Phone" name="phone"><Input /></Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>Save Profile</Button>
            </Form>
          )},
          { key: 'firm', label: 'Firm', children: (
            <Form form={firmForm} layout="vertical" onFinish={handleFirmSave} style={{ maxWidth: 500 }}>
              <Form.Item label="Firm Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item label="Address" name="address"><Input /></Form.Item>
              <Form.Item label="Phone" name="phone"><Input /></Form.Item>
              <Form.Item label="Website" name="website"><Input /></Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>Save Firm Settings</Button>
            </Form>
          )},
          { key: 'users', label: 'Users', children: (
            <Table dataSource={users} columns={userColumns} rowKey="id" pagination={false} />
          )},
          { key: 'security', label: 'Security', children: (
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange} style={{ maxWidth: 500 }}>
              <Form.Item label="Current Password" name="currentPassword" rules={[{ required: true }]}><Input.Password /></Form.Item>
              <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 12, message: 'Min 12 characters' }]}><Input.Password /></Form.Item>
              <Form.Item label="Confirm Password" name="confirmPassword" rules={[
                { required: true },
                ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) return Promise.resolve(); return Promise.reject(new Error('Passwords do not match')); } }),
              ]}><Input.Password /></Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>Change Password</Button>
            </Form>
          )},
        ]} />
      </Card>
    </div>
  );
}
