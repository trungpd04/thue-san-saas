import React, { useState } from 'react';
import { Layout } from 'antd';
import AdminSidebar from '../../Components/Admin/AdminSidebar';
import AdminHeader from '../../Components/Admin/AdminHeader';

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminSidebar collapsed={collapsed} />

            <Layout style={{ marginInlineStart: collapsed ? 80 : 240, transition: 'margin 0.2s' }}>
                <AdminHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

                <Content style={{
                    margin: 24,
                    padding: 24,
                    background: '#fff',
                    borderRadius: 8,
                    minHeight: 'calc(100vh - 64px - 48px)',
                    boxShadow: '0 1px 4px rgba(0,21,41,0.05)',
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
