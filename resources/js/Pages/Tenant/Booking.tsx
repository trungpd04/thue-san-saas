import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Card, Col, Input, message, Popconfirm, Radio, Row, Space, Spin, Table, Tag, Typography } from 'antd';
import { CalendarOutlined, CreditCardOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppDatePicker from '@/Components/Common/AppDatePicker';
import TenantLayout from '../../Layout/Tenant/TenantLayout';

const { Title, Text } = Typography;

export default function Booking({ fieldType }: { fieldType?: any }) {
    const { props } = usePage<any>();
    const slug = props.tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';
    const selectedFieldTypeId = fieldType?.id;

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [tenantFields, setTenantFields] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentType, setPaymentType] = useState<'cash' | 'banking'>('cash');
    const [historyType, setHistoryType] = useState<'all' | 'cash' | 'banking'>('all');
    const [bookingHistory, setBookingHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedHistoryBooking, setSelectedHistoryBooking] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTenantBookings(selectedDate);
        setSelectedSlots([]);
        setSelectedHistoryBooking(null);
    }, [selectedDate, selectedFieldTypeId]);

    useEffect(() => {
        fetchBookingHistory();
    }, [selectedDate, historyType, selectedFieldTypeId]);

    const fetchTenantBookings = async (date: string) => {
        setLoadingSlots(true);
        try {
            const params: any = { date };
            if (selectedFieldTypeId) {
                params.field_type_id = selectedFieldTypeId;
            }
            const response = await axios.get(`${base}/booking/available-slots`, { params });
            setTenantFields(response.data.fields || []);
        } catch (error) {
            message.error('Không thể lấy dữ liệu lịch đặt sân.');
        } finally {
            setLoadingSlots(false);
        }
    };

    const fetchBookingHistory = async () => {
        setLoadingHistory(true);
        try {
            const params: any = { date: selectedDate };
            if (historyType !== 'all') {
                params.type = historyType;
            }
            if (selectedFieldTypeId) {
                params.field_type_id = selectedFieldTypeId;
            }
            const response = await axios.get(`${base}/booking/history`, { params });
            setBookingHistory(response.data.bookings || []);
        } catch (error) {
            message.error('Không thể lấy lịch sử đặt sân.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const onDateChange = (date: dayjs.Dayjs | null) => {
        if (date) {
            setSelectedDate(date.format('YYYY-MM-DD'));
            setSelectedSlots([]);
            setSelectedHistoryBooking(null);
        }
    };

    const timeSlots: string[] = [];
    for (let h = 6; h <= 22; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

    const handleBook = async () => {
        if (!customerName || !customerPhone) {
            message.warning('Vui lòng nhập họ tên và số điện thoại.');
            return;
        }
        if (selectedSlots.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 khung giờ.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(`${base}/booking`, {
                date: selectedDate,
                customer_name: customerName,
                customer_phone: customerPhone,
                note: notes,
                payment_type: paymentType,
                total_price: totalPrice,
                pricing_breakdown: selectedSlots,
            });

            if (paymentType === 'banking') {
                router.get('/san/checkout', { booking_ids: response.data.booking_ids });
                return;
            }

            message.success('Đã khóa slot cho đơn đặt sân tiền mặt.');
            setSelectedSlots([]);
            setCustomerName('');
            setCustomerPhone('');
            setNotes('');
            fetchTenantBookings(selectedDate);
            fetchBookingHistory();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt sân.');
            fetchTenantBookings(selectedDate);
            fetchBookingHistory();
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (booking: any) => {
        try {
            await axios.delete(`${base}/booking/${booking.id}`);
            message.success('Đã hủy booking.');
            if (selectedHistoryBooking?.id === booking.id) {
                setSelectedHistoryBooking(null);
            }
            fetchTenantBookings(selectedDate);
            fetchBookingHistory();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Không thể hủy booking.');
        }
    };

    const isHistoryHighlighted = (fieldId: number, slot: any) => {
        if (!selectedHistoryBooking || selectedHistoryBooking.field_id !== fieldId) {
            return false;
        }

        const bookingStart = selectedHistoryBooking.start_time?.slice(0, 5);
        const bookingEnd = selectedHistoryBooking.end_time?.slice(0, 5);

        return slot.start_time >= bookingStart && slot.end_time <= bookingEnd;
    };

    const historyColumns = [
        {
            title: 'Sân',
            dataIndex: ['field', 'name'],
            key: 'field',
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.customer?.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.customer?.phone}</Text>
                </Space>
            ),
        },
        {
            title: 'Khung giờ',
            key: 'time',
            render: (_: any, record: any) => `${record.start_time?.slice(0, 5)} - ${record.end_time?.slice(0, 5)}`,
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            render: (_: any, record: any) => {
                const payment = record.payments?.[0];
                const type = payment?.type || 'banking';
                return <Tag color={type === 'cash' ? 'green' : 'blue'}>{type === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
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
            render: (value: string) => `${Number(value).toLocaleString()}đ`,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Popconfirm
                    title="Hủy booking"
                    description="Bạn có chắc chắn muốn hủy booking này chứ?"
                    okText="Hủy booking"
                    cancelText="Không"
                    okButtonProps={{ danger: true }}
                    onConfirm={(event) => {
                        event?.stopPropagation();
                        handleCancelBooking(record);
                    }}
                    onCancel={(event) => event?.stopPropagation()}
                >
                    <Button danger size="small" disabled={record.status === 'cancelled'} onClick={(event) => event.stopPropagation()}>
                        Hủy
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <>
            <Head title={fieldType ? `Đặt sân ${fieldType.name}` : 'Đặt sân offline'} />
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>{fieldType ? `Đặt sân ${fieldType.name}` : 'Đặt sân offline'}</Title>
                    <Text type="secondary">Nhân viên tạo đơn đặt sân khi khách đến sân trực tiếp.</Text>
                </div>

                <Card bodyStyle={{ padding: 24 }} bordered={false}>
                    <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={6}>
                            <Text strong><CalendarOutlined /> Chọn ngày:</Text>
                            <AppDatePicker value={selectedDate} onChange={onDateChange} style={{ width: '100%', marginTop: 8 }} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Text strong><UserOutlined /> Họ và tên:</Text>
                            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nhập họ tên" style={{ marginTop: 8 }} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Text strong>Số điện thoại:</Text>
                            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Nhập SĐT" style={{ marginTop: 8 }} />
                        </Col>
                        <Col xs={24} md={6}>
                            <Text strong><CreditCardOutlined /> Thanh toán:</Text>
                            <Radio.Group value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ width: '100%', marginTop: 8 }}>
                                <Radio.Button value="cash" style={{ width: '50%', textAlign: 'center' }}>Tiền mặt</Radio.Button>
                                <Radio.Button value="banking" style={{ width: '50%', textAlign: 'center' }}>Chuyển khoản</Radio.Button>
                            </Radio.Group>
                        </Col>
                        <Col span={24}>
                            <Text strong>Ghi chú:</Text>
                            <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nhập ghi chú nếu có" rows={2} style={{ marginTop: 8 }} />
                        </Col>
                    </Row>

                    <Spin spinning={loadingSlots}>
                        <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, paddingBottom: 16 }}>
                            <div style={{ minWidth: 1500 }}>
                                <div style={{ display: 'flex', background: '#7cb305', borderBottom: '1px solid #ccc', height: 40 }}>
                                    <div style={{ width: 120, flexShrink: 0, padding: '0 16px', borderRight: '1px solid #ccc' }} />
                                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                                        {timeSlots.map((time, index) => (
                                            <div key={index} style={{ flex: 1, position: 'relative', borderRight: '1px solid #ccc' }}>
                                                <div style={{ position: 'absolute', left: '-20px', width: 40, textAlign: 'center', top: 8, fontSize: 11, color: '#333', fontWeight: 500 }}>{time}</div>
                                            </div>
                                        ))}
                                        <div style={{ position: 'absolute', right: 0, top: 8, width: 40, textAlign: 'center', marginRight: -20, fontSize: 11, color: '#333', fontWeight: 500 }}>23:00</div>
                                    </div>
                                </div>

                                {tenantFields.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Không có sân nào</div>
                                ) : tenantFields.map((field) => (
                                    <div key={field.id} style={{ display: 'flex', borderBottom: '1px solid #ccc', minHeight: 52 }}>
                                        <div style={{ width: 120, flexShrink: 0, padding: 16, background: '#fff', borderRight: '1px solid #ccc', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{field.name}</div>
                                        <div style={{ flex: 1, display: 'flex' }}>
                                            {field.slots?.map((slot: any, idx: number) => {
                                                const isSelected = selectedSlots.some(s => s.field_id === field.id && s.start_time === slot.start_time);
                                                const isBooked = slot.status === 'booked';
                                                const isPending = slot.status === 'pending_payment';
                                                const isUnavailable = !slot.is_available;
                                                const isHighlighted = isHistoryHighlighted(field.id, slot);
                                                const bgColor = isSelected ? '#bae0ff' : isBooked ? '#ff4d4f' : isPending ? '#faad14' : 'transparent';

                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            flex: 1,
                                                            borderRight: '1px solid #ccc',
                                                            background: bgColor,
                                                            boxShadow: isHighlighted ? 'inset 0 0 0 3px #722ed1' : undefined,
                                                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                                            transition: 'background 0.2s, box-shadow 0.2s',
                                                        }}
                                                        onClick={() => {
                                                            if (isUnavailable) return;
                                                            if (isSelected) {
                                                                setSelectedSlots(prev => prev.filter(s => !(s.field_id === field.id && s.start_time === slot.start_time)));
                                                            } else {
                                                                setSelectedSlots(prev => [...prev, {
                                                                    field_id: field.id,
                                                                    start_time: slot.start_time,
                                                                    end_time: slot.end_time,
                                                                    price: slot.price_per_hour,
                                                                }]);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Spin>

                    <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Space size={16} wrap>
                            <Text type="secondary"><span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #ddd', marginRight: 6, verticalAlign: -2 }} />Còn trống</Text>
                            <Text type="secondary"><span style={{ display: 'inline-block', width: 14, height: 14, background: '#bae0ff', marginRight: 6, verticalAlign: -2 }} />Đang chọn</Text>
                            <Text type="secondary"><span style={{ display: 'inline-block', width: 14, height: 14, background: '#faad14', marginRight: 6, verticalAlign: -2 }} />Đang thao tác</Text>
                            <Text type="secondary"><span style={{ display: 'inline-block', width: 14, height: 14, background: '#ff4d4f', marginRight: 6, verticalAlign: -2 }} />Đã đặt</Text>
                        </Space>

                        <Space size={16}>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary">Tổng cộng</Text>
                                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f' }}>{totalPrice.toLocaleString()}đ</div>
                            </div>
                            <Button type="primary" size="large" loading={submitting} disabled={selectedSlots.length === 0} onClick={handleBook}>
                                Đặt sân
                            </Button>
                        </Space>
                    </div>
                </Card>

                <Card
                    title="Lịch sử đặt sân"
                    extra={(
                        <Radio.Group value={historyType} onChange={(e) => {
                            setHistoryType(e.target.value);
                            setSelectedHistoryBooking(null);
                        }}>
                            <Radio.Button value="all">Tất cả</Radio.Button>
                            <Radio.Button value="cash">Tiền mặt</Radio.Button>
                            <Radio.Button value="banking">Chuyển khoản</Radio.Button>
                        </Radio.Group>
                    )}
                    bordered={false}
                >
                    <Table
                        rowKey="id"
                        columns={historyColumns}
                        dataSource={bookingHistory}
                        loading={loadingHistory}
                        pagination={{ pageSize: 8 }}
                        rowSelection={{
                            type: 'radio',
                            selectedRowKeys: selectedHistoryBooking ? [selectedHistoryBooking.id] : [],
                            onChange: (_, selectedRows) => setSelectedHistoryBooking(selectedRows[0] || null),
                        }}
                        onRow={(record) => ({
                            onClick: () => setSelectedHistoryBooking(record),
                            style: { cursor: 'pointer' },
                        })}
                    />
                </Card>
            </Space>
        </>
    );
}

Booking.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
