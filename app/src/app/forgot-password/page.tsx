'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
    message.success('Reset link sent!');
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
      <Card style={{ width: 420, borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#2563EB',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>⚖</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>
            Reset Password
          </Title>
        </div>

        {!submitted ? (
          <>
            <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Paragraph>

            <Form layout="vertical" onFinish={handleSubmit} size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email address" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <Title level={4}>Check your email</Title>
            <Paragraph type="secondary">
              We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </Paragraph>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/login">
            <ArrowLeftOutlined style={{ marginRight: 6 }} />
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
