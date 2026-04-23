import { router } from '@inertiajs/react';
import React from 'react';
import { Layout, Typography, Avatar, Dropdown, Button, MenuProps } from 'antd';
import {
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

const userMenuItems: MenuProps['items'] = [
    {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
    },
    { type: 'divider' },
    {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
    },
];

interface AdminHeaderProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function AdminHeader({ collapsed, onToggle }: AdminHeaderProps) {
    const onUserMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'logout') {
            router.post('/admin/logout');
        }
    };

    return (
        <Header style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            height: 64,
        }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={onToggle}
                style={{ fontSize: 18, width: 40, height: 40 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                    style={{ width: 40, height: 40 }}
                />
                <Dropdown menu={{ items: userMenuItems, onClick: onUserMenuClick }} placement="bottomRight" arrow>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <Avatar style={{ background: '#7CB305' }} icon={<UserOutlined />} />
                        <Typography.Text strong>Admin</Typography.Text>
                    </div>
                </Dropdown>
            </div>
        </Header>
    );
}
