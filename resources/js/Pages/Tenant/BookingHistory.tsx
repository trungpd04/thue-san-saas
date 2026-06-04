import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, Col, Input, message, Popconfirm, Radio, Row, Space, Table, Tag, Typography, Select } from 'antd';
import { CalendarOutlined, CreditCardOutlined, UserOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppDatePicker from '@/Components/Common/AppDatePicker';
import TenantLayout from '../../Layout/Tenant/TenantLayout';

const { Title, Text } = Typography;

export default function BookingHistory() {
    const { props } = usePage<any>();
    const slug = props.tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';

    // Filters
    const [selectedDate, setSelectedDate] = useState<string | undefined>(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [fieldTypeFilter, setFieldTypeFilter] = useState<number | undefined>(undefined);
    const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'banking'>('all');

    // Data states
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [selectedDate, statusFilter, fieldTypeFilter, paymentTypeFilter, searchQuery]);

    const fetchHistory = async () => {
        setLoading(false);
        try {
            setLoading(true);
            const params: any = {};
            if (selectedDate) params.date = selectedDate;
            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;
            if (fieldTypeFilter) params.field_type_id = fieldTypeFilter;
            if (paymentTypeFilter !== 'all') params.type = paymentTypeFilter;

            const response = await axios.get(`${base}/booking/history/data`, { params });
            setBookings(response.data.bookings || []);
        } catch (error) {
            message.error('Không thể lấy lịch sử đặt sân.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (booking: any) => {
        try {
            await axios.delete(`${base}/booking/${booking.id}`);
            message.success('Đã hủy booking thành công.');
            fetchHistory();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Không thể hủy booking.');
        }
    };

    const handleClearFilters = () => {
        setSelectedDate(undefined);
        setSearchQuery('');
        setStatusFilter(undefined);
        setFieldTypeFilter(undefined);
        setPaymentTypeFilter('all');
    };

    const columns = [
        {
            title: 'Sân',
            dataIndex: ['field', 'name'],
            key: 'field',
            width: 150,
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'booking_date',
            key: 'booking_date',
            width: 120,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Khung giờ',
            key: 'time',
            width: 150,
            render: (_: any, record: any) => (
                <Tag color="orange" style={{ fontSize: 13, padding: '4px 8px' }}>
                    {record.start_time?.slice(0, 5)} - {record.end_time?.slice(0, 5)}
                </Tag>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.customer?.name || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <UserOutlined /> {record.customer?.phone || 'N/A'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 150,
            render: (_: any, record: any) => {
                const payment = record.payments?.[0];
                const type = payment?.type || 'banking';
                return (
                    <Tag color={type === 'cash' ? 'green' : 'blue'}>
                        {type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </Tag>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => {
                const statusMap: Record<string, { label: string; color: string }> = {
                    locked_pending: { label: 'Đang thao tác', color: 'gold' },
                    pending: { label: 'Chờ xử lý', color: 'orange' },
                    paid: { label: 'Đã thanh toán', color: 'green' },
                    confirmed: { label: 'Đã xác nhận', color: 'blue' },
                    cancelled: { label: 'Đã hủy', color: 'default' },
                };
                const item = statusMap[status] || { label: status, color: 'default' };
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total_price',
            key: 'total_price',
            align: 'right' as const,
            width: 130,
            render: (value: string) => (
                <Text strong style={{ color: '#ff4d4f' }}>
                    {Number(value).toLocaleString()}đ
                </Text>
            ),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            key: 'note',
            ellipsis: true,
            render: (note: string) => note ? <Text type="secondary">{note}</Text> : <Text type="secondary" italic>-</Text>
        },
        {
            title: 'Thao tác',
            key: 'actions',
            align: 'right' as const,
            width: 100,
            render: (_: any, record: any) => (
                <Popconfirm
                    title="Hủy booking"
                    description="Bạn có chắc chắn muốn hủy booking này chứ?"
                    okText="Hủy booking"
                    cancelText="Không"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleCancelBooking(record)}
                    disabled={record.status === 'cancelled'}
                >
                    <Button danger size="small" disabled={record.status === 'cancelled'}>
                        Hủy
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    const activeFieldTypes = props.tenantBookingFieldTypes || [];

    return (
        <>
            <Head title="Lịch sử đặt sân" />
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>Lịch sử đặt sân</Title>
                    <Text type="secondary">Quản lý và tra cứu toàn bộ danh sách các đơn đặt sân.</Text>
                </div>

                <Card bordered={false} bodyStyle={{ padding: 24 }}>
                    {/* Hàng bộ lọc */}
                    <div style={{ marginBottom: 24 }}>
                        {/* Hàng 1: Môn thể thao & Xóa lọc */}
                        <Row gutter={[16, 16]} align="bottom" style={{ marginBottom: 16 }}>
                            <Col xs={24} md={6}>
                                <Text strong>Môn thể thao:</Text>
                                <Select
                                    value={fieldTypeFilter}
                                    onChange={(val) => setFieldTypeFilter(val)}
                                    style={{ width: '100%', marginTop: 8 }}
                                    placeholder="Tất cả môn"
                                    allowClear
                                >
                                    {activeFieldTypes.map((ft: any) => (
                                        <Select.Option key={ft.id} value={ft.id}>{ft.name}</Select.Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} md={3}>
                                <Button
                                    type="default"
                                    icon={<ReloadOutlined />}
                                    onClick={handleClearFilters}
                                    style={{ width: '100%' }}
                                    title="Xóa bộ lọc"
                                >
                                    Xóa lọc
                                </Button>
                            </Col>
                        </Row>

                        {/* Hàng 2: Các bộ lọc còn lại */}
                        <Row gutter={[16, 16]} align="bottom">
                            <Col xs={24} sm={12} md={6}>
                                <Text strong>Tìm kiếm khách hàng:</Text>
                                <Input.Search
                                    placeholder="Tìm tên hoặc SĐT..."
                                    allowClear
                                    onSearch={(val) => setSearchQuery(val)}
                                    style={{ width: '100%', marginTop: 8 }}
                                    defaultValue={searchQuery}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Text strong>Ngày đặt:</Text>
                                <div style={{ marginTop: 8 }}>
                                    <AppDatePicker
                                        value={selectedDate}
                                        onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : undefined)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Text strong>Thanh toán:</Text>
                                <Select
                                    value={paymentTypeFilter}
                                    onChange={(val) => setPaymentTypeFilter(val)}
                                    style={{ width: '100%', marginTop: 8 }}
                                >
                                    <Select.Option value="all">Tất cả</Select.Option>
                                    <Select.Option value="cash">Tiền mặt</Select.Option>
                                    <Select.Option value="banking">Chuyển khoản</Select.Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Text strong>Trạng thái:</Text>
                                <Select
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val)}
                                    style={{ width: '100%', marginTop: 8 }}
                                    placeholder="Tất cả"
                                    allowClear
                                >
                                    <Select.Option value="pending">Chờ xử lý</Select.Option>
                                    <Select.Option value="confirmed">Đã xác nhận</Select.Option>
                                    <Select.Option value="paid">Đã thanh toán</Select.Option>
                                    <Select.Option value="cancelled">Đã hủy</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                    </div>

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={bookings}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} đơn`,
                            showSizeChanger: true
                        }}
                        style={{ background: '#fff' }}
                    />
                </Card>
            </Space>
        </>
    );
}

BookingHistory.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
