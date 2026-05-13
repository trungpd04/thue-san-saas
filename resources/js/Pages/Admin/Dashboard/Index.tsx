import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { formatVND } from '@/utils/currency';
import AdminLayout from '@/Layout/Admin/AdminLayout';

const { Title, Text } = Typography;

interface DashboardProps {
    stats: {
        total_tenants: number;
        total_revenue: number;
    };
}

export default function DashboardIndex({ stats }: DashboardProps) {
    return (
        <AdminLayout>
            <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
                <Head title="Central Dashboard" />
                
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
                        Tổng quan hệ thống
                    </Title>
                    <Text type="secondary">Thống kê số lượng chủ sân và doanh thu</Text>
                </div>

                <Row gutter={[20, 20]}>
                    {/* Thẻ 1: Chủ sân (Xanh dương) */}
                    <Col xs={24} sm={12}>
                        <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: 16, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Tổng số Tenant (Chủ sân)</span>}
                                value={stats?.total_tenants || 0}
                                styles={{ content: { color: '#fff', fontSize: 36, fontWeight: 800 } }}
                                prefix={<TeamOutlined style={{ opacity: 0.8, marginRight: 8 }} />}
                                suffix={<span style={{ fontSize: 16, fontWeight: 'normal', opacity: 0.8 }}>user</span>}
                            />
                        </Card>
                    </Col>

                    {/* Thẻ 2: Doanh thu (Tím) */}
                    <Col xs={24} sm={12}>
                        <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)', borderRadius: 16, boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Doanh thu toàn hệ thống</span>}
                                value={formatVND(stats?.total_revenue || 0)}
                                styles={{ content: { color: '#fff', fontSize: 36, fontWeight: 800 } }}
                                prefix={<DollarOutlined style={{ opacity: 0.8, marginRight: 8 }} />}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
}