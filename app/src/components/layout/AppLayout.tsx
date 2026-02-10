'use client';

import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Input, Badge, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  FileTextOutlined,
  SearchOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { getInitials } from '@/utils/formatters';
import { sidebarWidth } from '@/theme/tokens';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/cases', icon: <FolderOpenOutlined />, label: 'Cases' },
  { key: '/clients', icon: <TeamOutlined />, label: 'Clients' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documents' },
  { key: '/research', icon: <SearchOutlined />, label: 'Research' },
  { key: '/calendar', icon: <CalendarOutlined />, label: 'Calendar' },
  { key: '/billing', icon: <DollarOutlined />, label: 'Billing' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/compliance', icon: <SafetyCertificateOutlined />, label: 'Compliance' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, firm, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useLayout();

  const activeKey = '/' + (pathname.split('/')[1] || 'dashboard');

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        trigger={null}
        width={sidebarWidth.expanded}
        collapsedWidth={sidebarWidth.collapsed}
        style={{
          borderRight: '1px solid #E5E7EB',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? '0' : '0 24px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <Text
            strong
            style={{
              fontSize: sidebarCollapsed ? 16 : 18,
              color: '#2563EB',
              whiteSpace: 'nowrap',
            }}
          >
            {sidebarCollapsed ? 'LA' : 'Legal AI'}
          </Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarCollapsed ? sidebarWidth.collapsed : sidebarWidth.expanded,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            background: '#FFFFFF',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E5E7EB',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ fontSize: 16 }}
            />
            <Input
              placeholder="Search… (⌘K)"
              prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
              style={{ width: 320, borderRadius: 4 }}
              allowClear
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {firm && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {firm.name}
              </Text>
            )}
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#6B7280' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Avatar
                style={{
                  backgroundColor: '#2563EB',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                size={36}
              >
                {user ? getInitials(user.firstName, user.lastName) : '?'}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
