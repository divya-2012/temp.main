'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Divider, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    firmName: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F5F7',
        padding: 24,
      }}
    >
      <Card style={{ width: 480, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#2563EB', margin: 0, marginBottom: 8 }}>
            Create Account
          </Title>
          <Text type="secondary">Start your free trial of Legal AI Platform</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} size="large" requiredMark={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="John" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Doe" />
            </Form.Item>
          </div>

          <Form.Item
            label="Firm Name"
            name="firmName"
            rules={[{ required: true, message: 'Please enter your firm name' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Doe & Associates" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="john@doefirm.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please create a password' },
              { min: 12, message: 'Password must be at least 12 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Minimum 12 characters" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Already have an account?
          </Text>
        </Divider>

        <Link href="/login">
          <Button block>Sign In</Button>
        </Link>
      </Card>
    </div>
  );
}
