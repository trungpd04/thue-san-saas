import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Col, Row, Space, Statistic, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CreditCardOutlined, DollarOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import AdminLayout from '@/Layout/Admin/AdminLayout';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

const { Title, Text } = Typography;

interface TenantOwner {
    name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
}

interface TenantRecord {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    address?: string | null;
    is_active: boolean;
    created_at?: string;
    owner?: TenantOwner | null;
    active_subscription?: {
        id: number;
        status: string;
        ends_at?: string | null;
        plan?: {
            name: string;
            price_monthly: string | number;
        } | null;
    } | null;
    subscription_payments_count: number;
    paid_revenue?: string | number | null;
}

interface PageProps {
    tenants: TenantRecord[];
    stats: {
        total: number;
        active: number;
        inactive: number;
        revenue: number;
    };
}

const subscriptionStatusColor: Record<string, string> = {
    active: 'green',
    trial: 'blue',
    expired: 'red',
    cancelled: 'default',
};

export default function TenantManagement({ tenants = [], stats }: PageProps) {
    const handleStatusChange = (tenant: TenantRecord, checked: boolean) => {
        router.patch(
            `/admin/tenant-management/${tenant.id}/status`,
            { is_active: checked },
            {
                preserveScroll: true,
                onSuccess: () => message.success('Đã cập nhật trạng thái chủ sân.'),
                onError: () => message.error('Không thể cập nhật trạng thái.'),
            }
        );
    };

    const columns: ColumnsType<TenantRecord> = [
        {
            title: 'Chủ sân',
            key: 'tenant',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.name}</Text>
                    <Text type="secondary">{record.slug}</Text>
                    {record.phone && <Text type="secondary">{record.phone}</Text>}
                </Space>
            ),
        },
        {
            title: 'Tài khoản',
            key: 'owner',
            render: (_, record) => record.owner ? (
                <Space direction="vertical" size={0}>
                    <Text>{record.owner.name}</Text>
                    <Text type="secondary">{record.owner.email}</Text>
                </Space>
            ) : <Text type="secondary">Chưa có tài khoản</Text>,
        },
        {
            title: 'Gói hiện tại',
            key: 'subscription',
            render: (_, record) => {
                const subscription = record.active_subscription;

                if (!subscription) {
                    return <Tag>Chưa có gói</Tag>;
                }

                return (
                    <Space direction="vertical" size={4}>
                        <Space>
                            <Tag color={subscriptionStatusColor[subscription.status] ?? 'default'}>
                                {subscription.status}
                            </Tag>
                            <Text strong>{subscription.plan?.name ?? 'Không rõ gói'}</Text>
                        </Space>
                        <Text type="secondary">
                            Hết hạn: {subscription.ends_at ? formatDate(subscription.ends_at) : 'Không giới hạn'}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: 'Doanh thu',
            dataIndex: 'paid_revenue',
            key: 'paid_revenue',
            align: 'right',
            render: (value) => <Text strong>{formatVND(value)}</Text>,
        },
        {
            title: 'Trạng thái',
            key: 'is_active',
            render: (_, record) => (
                <Space>
                    <Switch checked={record.is_active} onChange={(checked) => handleStatusChange(record, checked)} />
                    <Tag color={record.is_active ? 'green' : 'red'}>
                        {record.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value) => value ? formatDate(value) : '',
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<SettingOutlined />}
                        onClick={() => router.visit(`/admin/tenant/${record.slug}/subscription`)}
                    >
                        Gói dịch vụ
                    </Button>
                    <Button
                        icon={<CreditCardOutlined />}
                        onClick={() => router.visit(`/admin/payment-history?search=${record.slug}`)}
                    >
                        Thanh toán
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Head title="Quản lí chủ sân" />
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lí chủ sân</Title>
                <Text type="secondary">Theo dõi tài khoản, gói dịch vụ và trạng thái hoạt động của từng chủ sân.</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Tổng chủ sân" value={stats.total} prefix={<TeamOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Đang hoạt động" value={stats.active} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Đã khóa" value={stats.inactive} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Doanh thu đã thanh toán" value={formatVND(stats.revenue)} prefix={<DollarOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns}
                    dataSource={tenants}
                    rowKey="id"
                    scroll={{ x: 1100 }}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </>
    );
}

TenantManagement.layout = (page: React.ReactNode) => <AdminLayout children={page} />;
