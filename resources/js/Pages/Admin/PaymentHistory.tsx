import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Col, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, ClockCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import AdminLayout from '@/Layout/Admin/AdminLayout';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

const { Title, Text } = Typography;

interface PaymentRecord {
    id: number;
    tenant?: {
        name: string;
        slug: string;
        phone?: string | null;
    } | null;
    subscription?: {
        plan?: {
            name: string;
        } | null;
    } | null;
    amount: string | number;
    payment_method: string;
    status: string;
    billing_period_start: string;
    billing_period_end: string;
    paid_at?: string | null;
    transaction_ref?: string | null;
    note?: string | null;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
}

interface PageProps {
    payments: Paginated<PaymentRecord>;
    filters: {
        status?: string;
        search?: string;
    };
    stats: {
        total_count: number;
        paid_amount: number;
        pending_amount: number;
    };
}

const statusMap: Record<string, { color: string; label: string }> = {
    paid: { color: 'green', label: 'Đã thanh toán' },
    success: { color: 'green', label: 'Thành công' },
    pending: { color: 'gold', label: 'Đang chờ' },
    failed: { color: 'red', label: 'Thất bại' },
    expired: { color: 'default', label: 'Hết hạn' },
};

export default function PaymentHistory({ payments, filters, stats }: PageProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const query = (nextFilters: Record<string, string | undefined>) => {
        router.get('/admin/payment-history', nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const columns: ColumnsType<PaymentRecord> = useMemo(() => [
        {
            title: 'Chủ sân',
            key: 'tenant',
            render: (_, record) => record.tenant ? (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.tenant.name}</Text>
                    <Text type="secondary">{record.tenant.slug}</Text>
                </Space>
            ) : <Text type="secondary">Không rõ</Text>,
        },
        {
            title: 'Gói dịch vụ',
            key: 'plan',
            render: (_, record) => record.subscription?.plan?.name ?? 'Không rõ gói',
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (value) => <Text strong>{formatVND(value)}</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const item = statusMap[status] ?? { color: 'default', label: status };
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: 'Phương thức',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (value) => <Tag>{value}</Tag>,
        },
        {
            title: 'Kỳ thanh toán',
            key: 'period',
            render: (_, record) => `${formatDate(record.billing_period_start)} - ${formatDate(record.billing_period_end)}`,
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'paid_at',
            key: 'paid_at',
            render: (value) => value ? formatDate(value) : <Text type="secondary">Chưa thanh toán</Text>,
        },
        {
            title: 'Mã giao dịch',
            dataIndex: 'transaction_ref',
            key: 'transaction_ref',
            render: (value) => value || <Text type="secondary">Không có</Text>,
        },
    ], []);

    return (
        <>
            <Head title="Lịch sử thanh toán" />
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Lịch sử thanh toán</Title>
                <Text type="secondary">Theo dõi các giao dịch thanh toán gói dịch vụ của chủ sân.</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Tổng giao dịch" value={stats.total_count} prefix={<CreditCardOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Đã thanh toán" value={formatVND(stats.paid_amount)} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic title="Đang chờ" value={formatVND(stats.pending_amount)} prefix={<ClockCircleOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Card>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        allowClear
                        placeholder="Tìm theo chủ sân, slug, SĐT, mã giao dịch"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onSearch={(value) => query({ ...filters, search: value || undefined })}
                        style={{ width: 360 }}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc trạng thái"
                        value={filters.status}
                        onChange={(value) => query({ ...filters, status: value })}
                        style={{ width: 180 }}
                        options={[
                            { value: 'pending', label: 'Đang chờ' },
                            { value: 'paid', label: 'Đã thanh toán' },
                            { value: 'success', label: 'Thành công' },
                            { value: 'failed', label: 'Thất bại' },
                            { value: 'expired', label: 'Hết hạn' },
                        ]}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={payments.data}
                    rowKey="id"
                    scroll={{ x: 1100 }}
                    pagination={{
                        current: payments.current_page,
                        pageSize: payments.per_page,
                        total: payments.total,
                        onChange: (page) => query({ ...filters, page: String(page) }),
                    }}
                />
            </Card>
        </>
    );
}

PaymentHistory.layout = (page: React.ReactNode) => <AdminLayout children={page} />;
