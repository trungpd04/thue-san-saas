import React from 'react';
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, Table, Typography, Tag, Space, Button, Breadcrumb } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import TenantLayout from "@/Layout/Tenant/TenantLayout";
import { App } from 'antd';

const { Title, Text } = Typography;

interface Plan {
    name: string;
}

interface Subscription {
    plan: Plan;
}

interface Payment {
    id: number;
    amount: string | number;
    status: string;
    payment_method: string;
    transaction_ref: string;
    billing_period_start: string;
    billing_period_end: string;
    paid_at: string | null;
    subscription: Subscription;
    created_at: string;
}

type StatusPageProps = {
    tenancy?: {
        tenant?: {
            slug?: string;
        } | null;
    };
};

export default function Status({ payments = [] }: { payments: Payment[] }) {
    const { tenancy } = usePage<StatusPageProps>().props;
    const tenantBasePath = tenancy?.tenant?.slug ? `/tenant/${tenancy.tenant.slug}` : '/tenant';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'pending':
                return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ thanh toán</Tag>;
            case 'success':
            case 'paid':
            case 'completed':
                return <Tag color="success" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>;
            case 'failed':
                return <Tag color="error" icon={<CloseCircleOutlined />}>Thất bại</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        {
            title: 'Mã giao dịch',
            dataIndex: 'transaction_ref',
            key: 'transaction_ref',
            render: (text: string) => <Text strong>{text || 'N/A'}</Text>,
        },
        {
            title: 'Gói dịch vụ',
            key: 'plan',
            render: (_: any, record: Payment) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.subscription?.plan?.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.billing_period_start} - {record.billing_period_end}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => formatCurrency(Number(amount)),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            <Head title="Lịch sử thanh toán" />

            <div style={{ marginBottom: 24 }}>
                <Breadcrumb items={[
                    { title: <Link href={`${tenantBasePath}/dashboard`}>Dashboard</Link> },
                    { title: <Link href={`${tenantBasePath}/subscription/register`}>Gói dịch vụ</Link> },
                    { title: 'Lịch sử thanh toán' },
                ]} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Lịch sử thanh toán</Title>
                <Link href={`${tenantBasePath}/subscription/register`}>
                    <Button icon={<ArrowLeftOutlined />}>Quay lại đăng ký</Button>
                </Link>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Table 
                    columns={columns} 
                    dataSource={payments} 
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có lịch sử giao dịch' }}
                />
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary">
                    Nếu bạn đã thanh toán nhưng trạng thái chưa cập nhật, vui lòng liên hệ hỗ trợ.
                </Text>
            </div>
        </div>
    );
}

Status.layout = (page: React.ReactNode) => (
    <App>
        <TenantLayout children={page} />
    </App>
);
