import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Typography, Row, Col, Card, Statistic, Divider, Space, Tag, Result } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;

export default function Checkout({ bookings, tenant }: any) {
    const [isExpired, setIsExpired] = useState(false);

    // Calculate expiration time (5 minutes from the first booking's locked_at)
    const lockedAt = dayjs(bookings[0].locked_at);
    const deadline = lockedAt.add(5, 'minute').valueOf();

    const onFinish = () => {
        setIsExpired(true);
    };

    const totalPrice = bookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_price), 0);

    if (isExpired) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-lg w-full shadow-lg rounded-xl text-center">
                    <Result
                        status="warning"
                        title="Giao dịch đã hết hạn"
                        subTitle="Slot đặt sân của bạn đã được giải phóng do quá thời gian thanh toán (5 phút). Vui lòng thực hiện đặt lại."
                        extra={[
                            <Link href={`/san/tenant/${tenant.id}/booking`} key="retry">
                                <Button type="primary" size="large">Đặt lại ngay</Button>
                            </Link>,
                            <Link href="/san" key="home">
                                <Button size="large">Quay về trang chủ</Button>
                            </Link>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Thanh toán đặt sân" />

            {/* Header Section */}
            <div className="bg-white shadow-sm mb-8" style={{ background: '#fff', padding: '24px 0', marginBottom: 32 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Link href={`/san/tenant/${tenant.id}/booking`}>
                            <Button icon={<ArrowLeftOutlined />} shape="circle" />
                        </Link>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>Thanh toán đơn hàng</Title>
                            <Text type="secondary">{tenant.name}</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
                <Row gutter={24}>
                    <Col xs={{ span: 24, order: 2 }} lg={{ span: 16, order: 1 }}>
                        <Card bordered={false} className="shadow-sm rounded-xl mb-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <div>
                                    <Title level={4}>Chi tiết đặt sân</Title>
                                    <Text type="secondary">Vui lòng kiểm tra lại thông tin trước khi thanh toán</Text>
                                </div>
                                <Tag color="blue" icon={<ClockCircleOutlined />} style={{ padding: '4px 12px', fontSize: 14 }}>
                                    Đang chờ thanh toán
                                </Tag>
                            </div>

                            {bookings.map((booking: any, index: number) => (
                                <div key={booking.id} style={{ marginBottom: 16, padding: 16, background: '#f9f9f9', borderRadius: 12 }}>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Text strong style={{ fontSize: 16 }}>{booking.field.name}</Text>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="secondary">
                                                    {dayjs(booking.booking_date).format('DD/MM/YYYY')} | {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col>
                                            <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
                                                {parseFloat(booking.total_price).toLocaleString()}đ
                                            </Text>
                                        </Col>
                                    </Row>
                                </div>
                            ))}

                            <Divider />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Title level={4} style={{ margin: 0 }}>Tổng cộng</Title>
                                <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                                    {totalPrice.toLocaleString()}đ
                                </Title>
                            </div>
                        </Card>

                        <Card bordered={false} className="shadow-sm rounded-xl">
                            <Title level={4}><InfoCircleOutlined /> Hướng dẫn thanh toán</Title>
                            <Paragraph>
                                1. Mở ứng dụng Ngân hàng hoặc Ví điện tử (Momo, ZaloPay,...) quét mã QR bên cạnh.
                            </Paragraph>
                            <Paragraph>
                                2. Kiểm tra số tiền và nội dung chuyển khoản chính xác.
                            </Paragraph>
                            <Paragraph>
                                3. Sau khi chuyển khoản thành công, hệ thống sẽ tự động cập nhật trạng thái trong vòng 1-2 phút.
                            </Paragraph>
                            <div style={{ background: '#fff7e6', padding: '12px 16px', borderRadius: 8, borderLeft: '4px solid #ffa940' }}>
                                <Text type="warning" strong>Lưu ý:</Text>
                                <br />
                                <Text type="secondary">
                                    Không tắt trang này cho đến khi nhận được thông báo thành công. Nếu quá 5 phút chưa thanh toán, yêu cầu đặt sân sẽ bị hủy tự động.
                                </Text>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={{ span: 24, order: 1 }} lg={{ span: 8, order: 2 }}>
                        <Card bordered={false} className="shadow-sm rounded-xl text-center sticky top-8">
                            <Text strong type="secondary">THỜI GIAN CÒN LẠI</Text>
                            <div style={{ margin: '16px 0' }}>
                                <Countdown
                                    value={deadline}
                                    onFinish={onFinish}
                                    valueStyle={{ color: '#ff4d4f', fontSize: 32, fontWeight: 'bold' }}
                                />
                            </div>

                            <Divider />

                            <Title level={5}>Quét mã QR để thanh toán</Title>
                            <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                background: '#f0f0f0',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                                border: '2px dashed #d9d9d9'
                            }}>
                                <div className="text-center p-4">
                                    <img
                                        src={`https://api.vietqr.io/image/970422-0904060802-lZlFp6y.jpg?amount=${totalPrice}&addInfo=BK${bookings[0].id}&accountName=TRUNG%20PHAN%20DUC`}
                                        alt="QR Payment"
                                        style={{ maxWidth: '100%', borderRadius: 8 }}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                        <Text strong>Nội dung: BK{bookings[0].id}</Text>
                                    </div>
                                </div>
                            </div>

                            <Button type="primary" block size="large" onClick={() => window.location.reload()} icon={<CheckCircleOutlined />}>
                                Tôi đã thanh toán
                            </Button>

                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Hệ thống tự động xác nhận qua Webhook
                                </Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
