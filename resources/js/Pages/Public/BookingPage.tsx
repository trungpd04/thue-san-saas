import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Typography, Space, Row, Col, DatePicker, message, Spin, Input, Card } from 'antd';
import { CalendarOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppDatePicker from '@/Components/Common/AppDatePicker';

const { Title, Text } = Typography;

export default function BookingPage({ tenant, fieldType }: any) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [tenantFields, setTenantFields] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTenantBookings(tenant.id, selectedDate);
    }, [tenant.id, selectedDate]);

    const fetchTenantBookings = async (tenantId: any, date: string) => {
        if (!tenantId) return;
        setLoadingSlots(true);
        try {
            const params: any = { date };
            if (fieldType?.id) {
                params.field_type_id = fieldType.id;
            }
            const response = await axios.get(`/san/tenant/${tenantId}/available-slots`, { params });
            setTenantFields(response.data.fields || []);
        } catch (error) {
            message.error('Không thể lấy dữ liệu lịch đặt sân.');
        } finally {
            setLoadingSlots(false);
        }
    };

    const onDateChange = (date: dayjs.Dayjs | null) => {
        if (date) {
            setSelectedDate(date.format('YYYY-MM-DD'));
            setSelectedSlots([]);
        }
    };

    // Calculate times for Gantt Chart (30 min intervals)
    const timeSlots: string[] = [];
    for (let h = 6; h <= 22; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

    const handleBook = async () => {
        if (!customerName || !customerPhone) {
            message.warning('Vui lòng nhập họ tên và số điện thoại!');
            return;
        }
        if (selectedSlots.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 khung giờ!');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(`/san/tenant/${tenant.id}/public-book`, {
                date: selectedDate,
                customer_name: customerName,
                customer_phone: customerPhone,
                note: notes,
                payment_type: 'banking',
                total_price: totalPrice,
                pricing_breakdown: selectedSlots
            });
            message.success('Slot đã được khóa tạm thời! Vui lòng thanh toán.');

            // Redirect to checkout
            router.get(`/san/checkout`, { booking_ids: response.data.booking_ids });
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt sân.');
            fetchTenantBookings(tenant.id, selectedDate);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title={`Đặt sân - ${tenant.name}`} />

            {/* Header Section */}
            <div className="bg-white shadow-sm mb-8" style={{ background: '#fff', padding: '24px 0', marginBottom: 32 }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Link href="/san">
                            <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" />
                        </Link>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>{tenant.name}</Title>
                            <Text type="secondary">{fieldType ? `Đặt ${fieldType.name}` : 'Chọn giờ và đặt sân trực tuyến'}</Text>
                        </div>
                    </div>
                    <Link href="/san/huong-dan-huy">
                        <Button type="default" danger size="large" style={{ borderRadius: 8, fontWeight: 500 }}>
                            Hủy lịch đặt
                        </Button>
                    </Link>
                </div>
            </div>

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                <Card bodyStyle={{ padding: 32 }} bordered={false} className="shadow-sm">
                    <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={8}>
                            <Text strong><CalendarOutlined /> Chọn ngày:</Text>
                            <AppDatePicker
                                value={selectedDate}
                                onChange={onDateChange}
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Text strong><UserOutlined /> Họ và tên:</Text>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nhập họ tên"
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Text strong>Số điện thoại:</Text>
                            <Input
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Nhập SĐT"
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                        <Col span={24} style={{ marginTop: 16 }}>
                            <Text strong>Ghi chú (Tùy chọn):</Text>
                            <Input.TextArea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Nhập ghi chú cho chủ sân (nếu có)"
                                rows={2}
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                    </Row>

                    <Spin spinning={loadingSlots}>
                        <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, paddingBottom: 16 }}>
                            <div style={{ minWidth: 1500 }}>
                                {/* Header row: Times */}
                                <div style={{ display: 'flex', background: '#7cb305', borderBottom: '1px solid #ccc', height: 40 }}>
                                    <div style={{ width: 120, flexShrink: 0, padding: '0 16px', fontWeight: 'bold', borderRight: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                                        {timeSlots.map((time, index) => (
                                            <div key={index} style={{
                                                flex: 1,
                                                position: 'relative',
                                                borderRight: '1px solid #ccc',
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-20px',
                                                    width: '40px',
                                                    textAlign: 'center',
                                                    top: '8px',
                                                    fontSize: 11,
                                                    color: '#333',
                                                    fontWeight: 500
                                                }}>
                                                    {time}
                                                </div>
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    width: '1px',
                                                    height: '6px',
                                                    background: '#FF9800'
                                                }}></div>
                                            </div>
                                        ))}
                                        {/* Final tick for the last hour (e.g., 23:00) */}
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '8px',
                                            width: '40px',
                                            textAlign: 'center',
                                            marginRight: '-20px',
                                            fontSize: 11,
                                            color: '#333',
                                            fontWeight: 500
                                        }}>
                                            23:00
                                        </div>
                                    </div>
                                </div>

                                {/* Rows for each Field */}
                                {tenantFields.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Không có sân nào</div>
                                ) : (
                                    tenantFields.map((field) => {
                                        return (
                                            <div key={field.id} style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                                                {/* Field Name */}
                                                <div style={{ width: 120, flexShrink: 0, padding: '16px', background: '#fff', borderRight: '1px solid #ccc', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {field.name}
                                                </div>

                                                {/* Timeline Area */}
                                                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                                                    {field.slots?.map((slot: any, idx: number) => {
                                                        const isSelected = selectedSlots.some(s => s.field_id === field.id && s.start_time === slot.start_time);
                                                        const isBooked = slot.status === 'booked';
                                                        const isPending = slot.status === 'pending_payment';
                                                        const isBlocked = slot.status === 'blocked';
                                                        const isSurge = slot.is_surge;
                                                        const isUnavailable = !slot.is_available;

                                                        let bgColor = 'transparent';
                                                        if (isSelected) bgColor = '#bae0ff';
                                                        else if (isBooked) bgColor = '#ff4d4f';
                                                        else if (isPending) bgColor = '#faad14';
                                                        else if (isBlocked) bgColor = '#d9d9d9';
                                                        else if (isSurge) bgColor = '#efdbff';

                                                        return (
                                                            <div
                                                                key={idx}
                                                                title={isSurge ? `Sự kiện: ${slot.surge_title || 'Tăng giá'}` : (isBlocked ? 'Sân bị khóa' : undefined)}
                                                                style={{
                                                                    flex: 1,
                                                                    borderRight: '1px solid #ccc',
                                                                    background: bgColor,
                                                                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                                                    transition: 'background 0.3s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: isUnavailable ? '#fff' : (isSelected ? '#000' : '#888'),
                                                                    fontSize: 10,
                                                                    fontWeight: isSelected ? 'bold' : 'normal'
                                                                }}
                                                                onClick={() => {
                                                                    if (!isUnavailable) {
                                                                        if (isSelected) {
                                                                            setSelectedSlots(prev => prev.filter(s => !(s.field_id === field.id && s.start_time === slot.start_time)));
                                                                        } else {
                                                                            setSelectedSlots(prev => [...prev, {
                                                                                field_id: field.id,
                                                                                start_time: slot.start_time,
                                                                                end_time: slot.end_time,
                                                                                price: slot.price_per_hour
                                                                            }]);
                                                                        }
                                                                    }
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isUnavailable && !isSelected) {
                                                                        e.currentTarget.style.background = '#e6f7ff';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isUnavailable && !isSelected) {
                                                                        e.currentTarget.style.background = 'transparent';
                                                                    }
                                                                }}
                                                            >
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </Spin>

                    <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4 }}></div>
                                <Text type="secondary">Còn trống</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#bae0ff', border: '1px solid #91d5ff', borderRadius: 4 }}></div>
                                <Text type="secondary">Đang chọn</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#faad14', borderRadius: 4 }}></div>
                                <Text type="secondary">Đang thao tác</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#ff4d4f', borderRadius: 4 }}></div>
                                <Text type="secondary">Đã được đặt</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#d9d9d9', borderRadius: 4 }}></div>
                                <Text type="secondary">Khóa sân</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#efdbff', borderRadius: 4 }}></div>
                                <Text type="secondary">Sự kiện</Text>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary">Tổng cộng:</Text>
                                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                                    {totalPrice.toLocaleString()}đ
                                </div>
                            </div>
                            <Button type="primary" size="large" onClick={handleBook} loading={submitting} disabled={selectedSlots.length === 0} style={{ padding: '0 32px' }}>
                                Tiến hành Đặt Sân
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
