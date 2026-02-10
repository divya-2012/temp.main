'use client';

import React from 'react';
import { Empty, Button } from 'antd';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No data',
  description = 'There are no items to display.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#1F2933', marginBottom: 4 }}>
              {title}
            </div>
            <div style={{ color: '#6B7280', fontSize: 14 }}>{description}</div>
          </div>
        }
      >
        {actionLabel && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  );
}
