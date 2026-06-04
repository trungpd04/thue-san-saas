import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Card, Col, Input, message, Radio, Row, Space, Spin, Typography, Select } from 'antd';
import { CalendarOutlined, CreditCardOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppDatePicker from '@/Components/Common/AppDatePicker';
import TenantLayout from '../../Layout/Tenant/TenantLayout';

const { Title, Text } = Typography;

export default function Booking({ fieldType }: { fieldType?: any }) {
    const { props } = usePage<any>();
    const slug = props.tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';

    const [activeFieldTypeId, setActiveFieldTypeId] = useState<number | undefined>(fieldType?.id);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [tenantFields, setTenantFields] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentType, setPaymentType] = useState<'cash' | 'banking'>('cash');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTenantBookings(selectedDate);
        setSelectedSlots([]);
    }, [selectedDate, activeFieldTypeId]);

    const fetchTenantBookings = async (date: string) => {
        setLoadingSlots(true);
        try {
            const params: any = { date };
            if (activeFieldTypeId) {
                params.field_type_id = activeFieldTypeId;
            }
            const response = await axios.get(`${base}/booking/available-slots`, { params });
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
                note: '',
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
            fetchTenantBookings(selectedDate);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt sân.');
            fetchTenantBookings(selectedDate);
        } finally {
            setSubmitting(false);
        }
    };

    const activeFieldTypeName = props.tenantBookingFieldTypes?.find((ft: any) => ft.id === activeFieldTypeId)?.name;

    return (
        <>
            <Head title={activeFieldTypeName ? `Đặt sân ${activeFieldTypeName}` : 'Đặt sân offline'} />
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            {activeFieldTypeName ? `Đặt sân ${activeFieldTypeName}` : 'Đặt sân offline'}
                        </Title>
                        <Text type="secondary">Nhân viên tạo đơn đặt sân khi khách đến sân trực tiếp.</Text>
                    </div>
                </div>

                <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderRadius: 12 }}>
                    {/* Bảng điều khiển (Control Panel) */}
                    <div style={{
                        background: '#fcfcfc',
                        padding: '20px 24px',
                        borderRadius: 10,
                        border: '1px solid #f0f0f0',
                        marginBottom: 24
                    }}>
                        {/* Hàng 1: Môn thể thao (1 mình 1 hàng) */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                            <Col xs={24} md={6}>
                                <div style={{ marginBottom: 8 }}>
                                    <AppstoreOutlined style={{ marginRight: 6, color: '#7cb305' }} />
                                    <Text strong style={{ fontSize: 12, color: '#555' }}>MÔN THỂ THAO</Text>
                                </div>
                                <Select
                                    value={activeFieldTypeId}
                                    onChange={(val) => setActiveFieldTypeId(val)}
                                    style={{ width: '100%' }}
                                    placeholder="Tất cả môn"
                                    allowClear
                                >
                                    {props.tenantBookingFieldTypes?.map((ft: any) => (
                                        <Select.Option key={ft.id} value={ft.id}>
                                            {ft.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        {/* Hàng 2: Ngày đặt và các trường thông tin khác */}
                        <Row gutter={[16, 16]} align="bottom">
                            <Col xs={24} sm={12} md={4}>
                                <div style={{ marginBottom: 6 }}>
                                    <CalendarOutlined style={{ marginRight: 6, color: '#7cb305' }} />
                                    <Text strong style={{ fontSize: 12, color: '#555' }}>NGÀY ĐẶT</Text>
                                </div>
                                <AppDatePicker value={selectedDate} onChange={onDateChange} style={{ width: '100%' }} />
                            </Col>

                            <Col xs={24} sm={12} md={7}>
                                <div style={{ marginBottom: 6 }}>
                                    <UserOutlined style={{ marginRight: 6, color: '#7cb305' }} />
                                    <Text strong style={{ fontSize: 12, color: '#555' }}>TÊN KHÁCH HÀNG</Text>
                                </div>
                                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Họ và tên" />
                            </Col>

                            <Col xs={24} sm={12} md={6}>
                                <div style={{ marginBottom: 6 }}>
                                    <Text strong style={{ fontSize: 12, color: '#555', marginLeft: 18 }}>SỐ ĐIỆN THOẠI</Text>
                                </div>
                                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Nhập số điện thoại" />
                            </Col>

                            <Col xs={24} sm={24} md={7}>
                                <div style={{ marginBottom: 6 }}>
                                    <CreditCardOutlined style={{ marginRight: 6, color: '#7cb305' }} />
                                    <Text strong style={{ fontSize: 12, color: '#555' }}>HÌNH THỨC THANH TOÁN</Text>
                                </div>
                                <Radio.Group value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ width: '100%' }}>
                                    <Radio.Button value="cash" style={{ width: '50%', textAlign: 'center' }}>Tiền mặt</Radio.Button>
                                    <Radio.Button value="banking" style={{ width: '50%', textAlign: 'center' }}>Chuyển khoản</Radio.Button>
                                </Radio.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Lưới lịch đặt sân */}
                    <Spin spinning={loadingSlots}>
                        <div style={{ 
                            overflowX: 'auto', 
                            border: '1px solid #ebebeb', 
                            borderRadius: 12, 
                            paddingBottom: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }}>
                            <div style={{ minWidth: 1500 }}>
                                {/* Timeline Header */}
                                <div style={{ 
                                    display: 'flex', 
                                    background: 'linear-gradient(90deg, #7cb305, #689704)', 
                                    borderBottom: '1px solid #5a8700', 
                                    height: 44,
                                    alignItems: 'center'
                                }}>
                                    <div style={{ 
                                        width: 120, 
                                        flexShrink: 0, 
                                        padding: '0 16px', 
                                        borderRight: '1px solid rgba(255,255,255,0.15)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: '#fff', 
                                        fontWeight: 600,
                                        fontSize: 12
                                    }}>
                                        Tên Sân
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', position: 'relative', height: '100%' }}>
                                        {timeSlots.map((time, index) => (
                                            <div key={index} style={{ 
                                                flex: 1, 
                                                position: 'relative', 
                                                height: '100%',
                                                borderRight: '1px solid rgba(255,255,255,0.12)' 
                                            }}>
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: '-20px', 
                                                    width: 40, 
                                                    textAlign: 'center', 
                                                    top: 13, 
                                                    fontSize: 11, 
                                                    color: '#fff', 
                                                    fontWeight: 600 
                                                }}>{time}</div>
                                            </div>
                                        ))}
                                        <div style={{ 
                                            position: 'absolute', 
                                            right: 0, 
                                            top: 13, 
                                            width: 40, 
                                            textAlign: 'center', 
                                            marginRight: -20, 
                                            fontSize: 11, 
                                            color: '#fff', 
                                            fontWeight: 600 
                                        }}>23:00</div>
                                    </div>
                                </div>

                                {/* Bảng các Sân */}
                                {tenantFields.length === 0 ? (
                                    <div style={{ padding: 48, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                                        Không có dữ liệu sân hiển thị
                                    </div>
                                ) : tenantFields.map((field) => (
                                    <div key={field.id} style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', minHeight: 52 }}>
                                        <div style={{ 
                                            width: 120, 
                                            flexShrink: 0, 
                                            padding: 12, 
                                            background: '#fafafa', 
                                            borderRight: '1px solid #e8e8e8', 
                                            fontWeight: 600, 
                                            color: '#434343',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            fontSize: 13
                                        }}>
                                            {field.name}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex' }}>
                                            {field.slots?.map((slot: any, idx: number) => {
                                                const isSelected = selectedSlots.some(s => s.field_id === field.id && s.start_time === slot.start_time);
                                                const isBooked = slot.status === 'booked';
                                                const isPending = slot.status === 'pending_payment';
                                                const isUnavailable = !slot.is_available;
                                                const bgColor = isSelected ? '#bae0ff' : isBooked ? '#ff4d4f' : isPending ? '#faad14' : 'transparent';

                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            flex: 1,
                                                            borderRight: '1px solid #e8e8e8',
                                                            background: bgColor,
                                                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.15s ease',
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

                    {/* Footer Trạng thái & Nút Đặt sân */}
                    <div style={{ 
                        marginTop: 24, 
                        display: 'flex', 
                        gap: 16, 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap',
                        background: '#fafafa',
                        padding: '16px 24px',
                        borderRadius: 10,
                        border: '1px solid #f0f0f0'
                    }}>
                        <Space size={20} wrap>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #d9d9d9', borderRadius: 4, marginRight: 8, verticalAlign: -2, background: '#fff' }} />
                                Còn trống
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                <span style={{ display: 'inline-block', width: 14, height: 14, background: '#bae0ff', borderRadius: 4, marginRight: 8, verticalAlign: -2 }} />
                                Đang chọn
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                <span style={{ display: 'inline-block', width: 14, height: 14, background: '#faad14', borderRadius: 4, marginRight: 8, verticalAlign: -2 }} />
                                Đang thao tác
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                <span style={{ display: 'inline-block', width: 14, height: 14, background: '#ff4d4f', borderRadius: 4, marginRight: 8, verticalAlign: -2 }} />
                                Đã đặt
                            </Text>
                        </Space>

                        <Space size={24}>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>TỔNG CỘNG</Text>
                                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f', lineHeight: 1.2 }}>{totalPrice.toLocaleString()}đ</div>
                            </div>
                            <Button 
                                type="primary" 
                                size="large" 
                                loading={submitting} 
                                disabled={selectedSlots.length === 0} 
                                onClick={handleBook}
                                style={{ 
                                    height: 48, 
                                    paddingLeft: 32, 
                                    paddingRight: 32, 
                                    borderRadius: 8,
                                    fontSize: 15,
                                    fontWeight: 600,
                                    background: '#7cb305',
                                    borderColor: '#7cb305'
                                }}
                            >
                                Đặt sân
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Space>
        </>
    );
}

Booking.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
