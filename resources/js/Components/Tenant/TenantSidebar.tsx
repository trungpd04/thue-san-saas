import React from 'react';
import { Layout, Menu, Typography, MenuProps, Space } from 'antd';
import { AppstoreOutlined, CalendarOutlined, CreditCardOutlined, DashboardOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface TenantSidebarProps {
    collapsed: boolean;
}

export default function TenantSidebar({ collapsed }: TenantSidebarProps) {
    const { url, props } = usePage<any>();
    const { tenancy, auth } = props;
    const slug = tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';

    const user = auth?.user;
    const isManager = user?.role === 'manager';
    const permissions = user?.permissions || [];

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (isManager) return true;
        return permissions.includes(permission);
    };

    const menuItems: MenuItem[] = [];

    // 1. Dashboard
    if (hasPermission('access_dashboard')) {
        menuItems.push({
            key: `${base}/dashboard`,
            icon: <DashboardOutlined />,
            label: <Link href={`${base}/dashboard`}>Tổng quan</Link>,
        });
    }

    // 3. Fields
    if (hasPermission('manage_fields')) {
        menuItems.push({
            key: `${base}/fields`,
            icon: <AppstoreOutlined />,
            label: <Link href={`${base}/fields`}>Quản lý sân</Link>,
        });
    }

    // 4. Field Prices
    if (hasPermission('manage_field_prices')) {
        menuItems.push({
            key: `${base}/field-prices`,
            icon: <CreditCardOutlined />,
            label: <Link href={`${base}/field-prices`}>Cấu hình giá</Link>,
        });
    }

    // 5. Booking Group
    if (hasPermission('manage_bookings')) {
        menuItems.push({
            key: 'booking-group',
            icon: <CalendarOutlined />,
            label: 'Quản lý đặt sân',
            children: [
                {
                    key: `${base}/booking`,
                    label: <Link href={`${base}/booking`}>Đặt sân</Link>,
                },
                {
                    key: `${base}/booking/history`,
                    label: <Link href={`${base}/booking/history`}>Lịch sử đặt</Link>,
                },
            ],
        });
    }

    // 6. Subscription Group (Manager only)
    if (isManager) {
        menuItems.push({
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
                },
            ]
        });
    }

    // 7. Settings Group
    const settingsChildren: MenuItem[] = [
        {
            key: `${base}/profile`,
            icon: <UserOutlined />,
            label: <Link href={`${base}/profile`}>Thông tin trung tâm</Link>,
        }
    ];

    if (isManager) {
        settingsChildren.push({
            key: `${base}/sepay/settings`,
            icon: <CreditCardOutlined />,
            label: <Link href={`${base}/sepay/settings`}>Cấu hình nhận tiền</Link>,
        });
        
        settingsChildren.push({
            key: `${base}/staff`,
            icon: <UserOutlined />,
            label: <Link href={`${base}/staff`}>Quản lý nhân viên</Link>,
        });
    }

    menuItems.push({
        key: 'settings-group',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
        children: settingsChildren,
    });

    const activeKey = url;
    const defaultOpenKeys = [
        url.startsWith(`${base}/booking`) ? 'booking-group' : null,
        url.startsWith(`${base}/subscription`) ? 'subscription-group' : null,
        url.startsWith(`${base}/sepay`) || url.startsWith(`${base}/profile`) || url.startsWith(`${base}/staff`) ? 'settings-group' : null,
    ].filter(Boolean) as string[];

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
                defaultOpenKeys={defaultOpenKeys}
                items={menuItems}
                style={{ marginTop: 8, border: 'none' }}
            />
        </Sider>
    );
}