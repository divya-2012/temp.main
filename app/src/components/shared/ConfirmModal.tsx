'use client';

import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  content?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  content = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: '#D97706', marginRight: 8 }} />
          {title}
        </span>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger, loading }}
      centered
    >
      <p style={{ color: '#6B7280', margin: '16px 0' }}>{content}</p>
    </Modal>
  );
}
