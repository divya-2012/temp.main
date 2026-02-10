import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date: string | Date, format = 'MMM D, YYYY'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getInitials(firstNameOrFull?: string, lastName?: string): string {
  if (!firstNameOrFull) return '?';
  if (lastName !== undefined) {
    const f = firstNameOrFull.charAt(0)?.toUpperCase() || '';
    const l = lastName?.charAt(0)?.toUpperCase() || '';
    return `${f}${l}` || '?';
  }
  // Single string - split by spaces
  const parts = firstNameOrFull.trim().split(/\s+/);
  const f = parts[0]?.charAt(0)?.toUpperCase() || '';
  const l = parts.length > 1 ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() || '' : '';
  return `${f}${l}` || '?';
}

export function getClientDisplayName(client: {
  type: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}): string {
  if (client.type === 'COMPANY') return client.companyName || 'Unknown Company';
  return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown Client';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
