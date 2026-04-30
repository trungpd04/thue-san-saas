import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Typography, Space, Row, Col, DatePicker, message, Spin, Input, Card } from 'antd';
import { CalendarOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function BookingPage({ tenant }: any) {
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
            const response = await axios.get(`/san/tenant/${tenantId}/available-slots`, { params: { date } });
            setTenantFields(response.data.fields || []);
        } catch (error) {
            message.error('Không thể lấy dữ liệu lịch đặt sân.');
        } finally {
            setLoadingSlots(false);
        }
    };

    const onDateChange = (date: dayjs.Dayjs | null, dateString: string | string[] | null) => {
        const ds = Array.isArray(dateString) ? dateString[0] : dateString;
        if (ds && typeof ds === 'string') {
            setSelectedDate(ds);
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
            await axios.post(`/san/tenant/${tenant.id}/public-book`, {
                date: selectedDate,
                customer_name: customerName,
                customer_phone: customerPhone,
                note: notes,
                total_price: totalPrice,
                pricing_breakdown: selectedSlots
            });
            message.success('Đặt sân thành công!');
            setCustomerName('');
            setCustomerPhone('');
            setNotes('');
            setSelectedSlots([]);
            fetchTenantBookings(tenant.id, selectedDate);
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
                            <Text type="secondary">Chọn giờ và đặt sân trực tuyến</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                <Card bodyStyle={{ padding: 32 }} bordered={false} className="shadow-sm">
                    <Row gutter={24} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Text strong><CalendarOutlined /> Chọn ngày:</Text>
                            <DatePicker
                                value={dayjs(selectedDate)}
                                onChange={onDateChange}
                                format="YYYY-MM-DD"
                                allowClear={false}
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                        <Col span={8}>
                            <Text strong><UserOutlined /> Họ và tên:</Text>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nhập họ tên"
                                style={{ width: '100%', marginTop: 8 }}
                            />
                        </Col>
                        <Col span={8}>
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
                                <div style={{ display: 'flex', background: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}>
                                    <div style={{ width: 120, flexShrink: 0, padding: '12px 16px', fontWeight: 'bold', borderRight: '1px solid #91d5ff' }}>
                                        Sân
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                                        {timeSlots.map((time, index) => (
                                            <div key={index} style={{ flex: 1, textAlign: 'center', padding: '12px 0', fontSize: 11, borderRight: '1px solid #91d5ff', color: '#0050b3' }}>
                                                {time}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rows for each Field */}
                                {tenantFields.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Không có sân nào</div>
                                ) : (
                                    tenantFields.map((field) => {
                                        return (
                                            <div key={field.id} style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
                                                {/* Field Name */}
                                                <div style={{ width: 120, flexShrink: 0, padding: '16px', background: '#fafafa', borderRight: '1px solid #f0f0f0', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                                    {field.name}
                                                </div>

                                                {/* Timeline Area */}
                                                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                                                    {field.slots?.map((slot: any, idx: number) => {
                                                        const isSelected = selectedSlots.some(s => s.field_id === field.id && s.start_time === slot.start_time);
                                                        const isBooked = !slot.is_available;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    flex: 1,
                                                                    borderRight: '1px solid #f0f0f0',
                                                                    background: isSelected ? '#bae0ff' : (isBooked ? '#ff4d4f' : 'transparent'),
                                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                                    transition: 'background 0.3s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: isBooked ? '#fff' : (isSelected ? '#000' : '#888'),
                                                                    fontSize: 10,
                                                                    fontWeight: isSelected ? 'bold' : 'normal'
                                                                }}
                                                                onClick={() => {
                                                                    if (!isBooked) {
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
                                                                    if (!isBooked && !isSelected) {
                                                                        e.currentTarget.style.background = '#e6f7ff';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isBooked && !isSelected) {
                                                                        e.currentTarget.style.background = 'transparent';
                                                                    }
                                                                }}
                                                            >
                                                                {!isBooked && slot.price_per_hour > 0 && `${(slot.price_per_hour / 1000)}k`}
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

                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4 }}></div>
                                <Text type="secondary">Còn trống</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#bae0ff', border: '1px solid #91d5ff', borderRadius: 4 }}></div>
                                <Text type="secondary">Đang chọn</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 16, height: 16, background: '#ff4d4f', borderRadius: 4 }}></div>
                                <Text type="secondary">Đã được đặt</Text>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
