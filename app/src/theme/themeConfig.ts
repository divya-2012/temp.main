import type { ThemeConfig } from 'antd';

const themeConfig: ThemeConfig = {
  token: {
    // Colors from ui-design.md
    colorPrimary: '#2563EB',
    colorError: '#DC2626',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorInfo: '#0284C7',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F7',
    colorText: '#1F2933',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#E5E7EB',

    // Typography
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    lineHeight: 1.6,

    // Shape – subtle corners only (4px)
    borderRadius: 4,
    borderRadiusLG: 4,
    borderRadiusSM: 4,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    margin: 16,
    marginLG: 24,

    // Motion – fast and subtle
    motionDurationFast: '0.15s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.2s',
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      bodyBg: '#F5F5F7',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#EFF6FF',
      itemSelectedColor: '#2563EB',
      itemHoverBg: '#F3F4F6',
    },
    Button: {
      borderRadius: 4,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 40,
    },
    Table: {
      headerBg: '#F9FAFB',
      rowHoverBg: '#F3F4F6',
      borderRadius: 4,
    },
    Card: {
      borderRadius: 4,
      paddingLG: 24,
    },
    Modal: {
      borderRadius: 4,
    },
  },
};

export default themeConfig;
