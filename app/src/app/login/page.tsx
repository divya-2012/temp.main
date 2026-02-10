'use client';

import React, { Suspense, useState } from 'react';
import { Card, Form, Input, Button, Typography, Divider, message, Spin } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || 'Invalid email or password');
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
      <Card style={{ width: 420, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#2563EB', margin: 0, marginBottom: 8 }}>
            Legal AI Platform
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} size="large" requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@lawfirm.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link href="/forgot-password" style={{ fontSize: 13 }}>
              Forgot password?
            </Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Don&apos;t have an account?
          </Text>
        </Divider>

        <Link href="/register">
          <Button block>Create Account</Button>
        </Link>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
