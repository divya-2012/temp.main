export const colors = {
  // Base (Light Theme)
  bgMain: '#F5F5F7',
  surface: '#FFFFFF',
  textPrimary: '#1F2933',
  textSecondary: '#6B7280',
  divider: '#E5E7EB',

  // Accent
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  destructive: '#DC2626',
  destructiveHover: '#B91C1C',

  // Status
  success: '#16A34A',
  warning: '#D97706',
  info: '#0284C7',
  disabled: '#9CA3AF',

  // Backgrounds
  bgHover: '#F3F4F6',
  bgSelected: '#EFF6FF',
  bgHeader: '#F9FAFB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const sidebarWidth = {
  expanded: 240,
  collapsed: 80,
} as const;
