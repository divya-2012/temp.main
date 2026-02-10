'use client';

import React from 'react';
import { Tag } from 'antd';
import type { CaseStatus, TaskStatus, InvoiceStatus, ComplianceStatus, DocumentStatus } from '@/types';

type StatusType = CaseStatus | TaskStatus | InvoiceStatus | ComplianceStatus | DocumentStatus;

const statusConfig: Record<string, { color: string; label: string }> = {
  // Case statuses
  OPEN: { color: 'blue', label: 'Open' },
  IN_PROGRESS: { color: 'processing', label: 'In Progress' },
  ON_HOLD: { color: 'warning', label: 'On Hold' },
  CLOSED: { color: 'default', label: 'Closed' },
  ARCHIVED: { color: 'default', label: 'Archived' },

  // Task statuses
  TODO: { color: 'default', label: 'To Do' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'default', label: 'Cancelled' },

  // Invoice statuses
  DRAFT: { color: 'default', label: 'Draft' },
  SENT: { color: 'blue', label: 'Sent' },
  PAID: { color: 'success', label: 'Paid' },
  OVERDUE: { color: 'error', label: 'Overdue' },

  // Compliance statuses
  PENDING: { color: 'warning', label: 'Pending' },
  COMPLIANT: { color: 'success', label: 'Compliant' },
  NON_COMPLIANT: { color: 'error', label: 'Non-Compliant' },

  // Document statuses
  UPLOADED: { color: 'blue', label: 'Uploaded' },
  PROCESSING: { color: 'processing', label: 'Processing' },
  ANALYZED: { color: 'success', label: 'Analyzed' },
  ERROR: { color: 'error', label: 'Error' },
};

interface StatusTagProps {
  status: StatusType;
}

export default function StatusTag({ status }: StatusTagProps) {
  const config = statusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
