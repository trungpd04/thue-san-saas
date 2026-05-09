import React from 'react';
import { Layout, Menu, Typography, MenuProps, Space } from 'antd';
import { AppstoreOutlined, CalendarOutlined, CreditCardOutlined, DashboardOutlined, UserOutlined } from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface TenantSidebarProps {
    collapsed: boolean;
}

export default function TenantSidebar({ collapsed }: TenantSidebarProps) {
    const { url, props } = usePage<any>();
    const { tenancy } = props;
    const slug = tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';

    const menuItems: MenuItem[] = [
        {
            key: `${base}/dashboard`,
            icon: <DashboardOutlined />,
            label: <Link href={`${base}/dashboard`}>Tổng quan</Link>,
        },
        
        {
            key: `${base}/customer`,
            icon: <UserOutlined />,
            label: <Link href={`${base}/customer`}>Khách hàng</Link>,
        },
        {
            key: `${base}/fields`,
            icon: <AppstoreOutlined />,
            label: <Link href={`${base}/fields`}>Quản lý sân</Link>,
        },
        {
            key: `${base}/booking`,
            icon: <CalendarOutlined />,
            label: <Link href={`${base}/booking`}>Đặt sân</Link>,
        },
        {
            key: 'subscription-group',
            icon: <CreditCardOutlined />,
            label: (
                <Space>
                    <span>Gói cước</span>
                </Space>
            ),
            children: [
                {
                    key: `${base}/subscription/register`,
                    icon: <CreditCardOutlined />,
                    label: <Link href={`${base}/subscription/register`}>Đăng ký gói</Link>,
                },
                {
                    key: `${base}/subscription/status`,
                    icon: <CreditCardOutlined />,
                    label: <Link href={`${base}/subscription/status`}>Lịch sử thanh toán</Link>,
                }
            ]
        },
    ];

    const activeKey = url; // Simplified for now

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            style={{
                background: '#001529',
                position: 'fixed',
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                zIndex: 100,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'unset',
            }}
        >
            <div style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? 0 : '0 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s',
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #7CB305, #5a8700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <CalendarOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                {!collapsed && (
                    <Typography.Text strong style={{
                        color: '#fff',
                        fontSize: 15,
                        marginLeft: 12,
                        whiteSpace: 'nowrap',
                    }}>
                        Quản lí sân
                    </Typography.Text>
                )}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[activeKey]}
                items={menuItems}
                style={{ marginTop: 8, border: 'none' }}
            />
        </Sider>
    );
}
