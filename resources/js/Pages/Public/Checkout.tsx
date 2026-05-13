import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Alert, App, Button, Card, Col, Divider, Result, Row, Space, Statistic, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

export default function Checkout({ bookings, tenant, payment }: any) {
    return (
        <App>
            <CheckoutContent bookings={bookings} tenant={tenant} payment={payment} />
        </App>
    );
}

function CheckoutContent({ bookings, tenant, payment }: any) {
    const [isExpired, setIsExpired] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const { message } = App.useApp();

    const lockedAt = dayjs(bookings[0].locked_at);
    const deadline = lockedAt.add(5, 'minute').valueOf();
    const totalPrice = useMemo(
        () => bookings.reduce((sum: number, booking: any) => sum + Number(booking.total_price), 0),
        [bookings],
    );

    const bankAccount = payment?.bank_account;
    const bankCode = bankAccount?.bank_id ?? bankAccount?.bank_code ?? bankAccount?.brand_name;
    const accountNumber = bankAccount?.account_number ?? bankAccount?.sub_account;
    const accountName = bankAccount?.account_holder_name ?? bankAccount?.sub_holder_name ?? tenant.name;
    const paymentCode = payment?.code ?? `BK${bookings[0].id}`;
    const canPay = !payment?.error && bankCode && accountNumber;
    const qrUrl = canPay
        ? `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${Math.round(totalPrice)}&addInfo=${encodeURIComponent(paymentCode)}&accountName=${encodeURIComponent(accountName)}`
        : null;

    useEffect(() => {
        if (isPaid || isExpired) return;

        const bookingIds = bookings.map((booking: any) => booking.id).join(',');
        const interval = window.setInterval(async () => {
            try {
                const response = await axios.get('/san/booking-status', {
                    params: { booking_ids: bookingIds },
                });

                if (response.data.paid === true || response.data.paid === 'true') {
                    message.success('Thanh toán thành công. Đặt sân của bạn đã được xác nhận.');
                    setIsPaid(true);
                    window.clearInterval(interval);
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 3000);

        return () => window.clearInterval(interval);
    }, [bookings, isPaid, isExpired, message]);

    if (isExpired) {
        return (
            <CenteredResult
                status="warning"
                title="Giao dịch đã hết hạn"
                subTitle="Slot đặt sân đã được giải phóng do quá thời gian thanh toán 5 phút."
                extra={[
                    <Link href={`/san/tenant/${tenant.id}/booking`} key="retry">
                        <Button type="primary" size="large">Đặt lại</Button>
                    </Link>,
                    <Link href="/san" key="home">
                        <Button size="large">Về danh sách sân</Button>
                    </Link>,
                ]}
            />
        );
    }

    if (isPaid) {
        return (
            <CenteredResult
                status="success"
                title="Thanh toán thành công"
                subTitle="Webhook SePay Bank Hub đã xác nhận giao dịch và hệ thống đã chốt đơn."
                extra={[
                    <Link href="/san" key="home">
                        <Button type="primary" size="large">Về danh sách sân</Button>
                    </Link>,
                    <Button size="large" onClick={() => window.print()} key="print">In hóa đơn</Button>,
                ]}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Thanh toán đặt sân" />

            <div style={{ background: '#fff', padding: '24px 0', marginBottom: 32 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href={`/san/tenant/${tenant.id}/booking`}>
                        <Button icon={<ArrowLeftOutlined />} shape="circle" />
                    </Link>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Thanh toán đặt sân</Title>
                        <Text type="secondary">{tenant.name}</Text>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
                {payment?.error && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                        message="Chưa thể nhận thanh toán tự động"
                        description={payment.error}
                    />
                )}

                <Row gutter={24}>
                    <Col xs={{ span: 24, order: 2 }} lg={{ span: 16, order: 1 }}>
                        <Card variant="borderless" className="shadow-sm rounded-xl mb-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                <div>
                                    <Title level={4}>Chi tiết đặt sân</Title>
                                    <Text type="secondary">Các slot này đang được giữ trong thời gian thanh toán.</Text>
                                </div>
                                <Tag color="blue" icon={<ClockCircleOutlined />}>Chờ thanh toán</Tag>
                            </div>

                            {bookings.map((booking: any) => (
                                <div key={booking.id} style={{ marginBottom: 12, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                                    <Row justify="space-between" align="middle" gutter={16}>
                                        <Col>
                                            <Text strong>{booking.field.name}</Text>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="secondary">
                                                    {dayjs(booking.booking_date).format('DD/MM/YYYY')} | {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                </Text>
                                            </div>
                                        </Col>
                                        <Col>
                                            <Text strong style={{ color: '#cf1322' }}>
                                                {Number(booking.total_price).toLocaleString('vi-VN')}đ
                                            </Text>
                                        </Col>
                                    </Row>
                                </div>
                            ))}

                            <Divider />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Title level={4} style={{ margin: 0 }}>Tổng cộng</Title>
                                <Title level={3} style={{ margin: 0, color: '#cf1322' }}>
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </Title>
                            </div>
                        </Card>

                        <Card variant="borderless" className="shadow-sm rounded-xl">
                            <Title level={4}><InfoCircleOutlined /> Hướng dẫn thanh toán</Title>
                            <Paragraph>1. Quét QR hoặc chuyển khoản đúng số tiền vào tài khoản của chủ sân.</Paragraph>
                            <Paragraph>2. Nội dung chuyển khoản phải là <Text code>{paymentCode}</Text>.</Paragraph>
                            <Paragraph>3. SePay Bank Hub gửi webhook về hệ thống; đơn sẽ tự chuyển sang trạng thái đã thanh toán.</Paragraph>
                            <Alert
                                type="info"
                                showIcon
                                message="Không cần bấm xác nhận thủ công"
                                description="Trang này tự kiểm tra trạng thái mỗi vài giây. Nếu quá 5 phút chưa có webhook thanh toán, slot sẽ được giải phóng."
                            />
                        </Card>
 
                        {payment?.webhook_token && (
                            <Card variant="borderless" className="shadow-sm rounded-xl mt-6" style={{ background: '#fff7e6', border: '1px solid #ffe7ba' }}>
                                <Title level={4}>🛠️ Developer Tools</Title>
                                <Paragraph>Dùng nút này để giả lập SePay gửi webhook thanh toán thành công (Chỉ hiển thị ở Local).</Paragraph>
                                <Button
                                    type="primary"
                                    danger
                                    onClick={async () => {
                                        try {
                                            const res = await axios.post(payment.webhook_url, {
                                                event_type: 'TRANSACTION_NEW',
                                                data: {
                                                    content: paymentCode,
                                                    amount_in: totalPrice,
                                                    transaction_id: 'SIM-' + Date.now(),
                                                    reference_number: 'REF' + Date.now()
                                                }
                                            }, {
                                                headers: {
                                                    'X-Secret-Key': payment.webhook_token,
                                                    'Content-Type': 'application/json'
                                                }
                                            });
                                            message.success('Đã gửi giả lập webhook: ' + (res.data.message || 'Thành công'));
                                        } catch (err: any) {
                                            message.error('Lỗi giả lập: ' + (err.response?.data?.message || err.message));
                                        }
                                    }}
                                >
                                    Giả lập Thanh toán Thành công
                                </Button>
                            </Card>
                        )}
                    </Col>

                    <Col xs={{ span: 24, order: 1 }} lg={{ span: 8, order: 2 }}>
                        <Card variant="borderless" className="shadow-sm rounded-xl text-center sticky top-8">
                            <Text strong type="secondary">THỜI GIAN CÒN LẠI</Text>
                            <div style={{ margin: '16px 0' }}>
                                <Statistic.Timer
                                    type="countdown"
                                    value={deadline}
                                    onFinish={() => !isPaid && setIsExpired(true)}
                                    styles={{ content: { color: '#cf1322', fontSize: 32, fontWeight: 700 } }}
                                />
                            </div>

                            <Divider />

                            {canPay ? (
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Title level={5}>Quét mã QR</Title>
                                    <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                                        <img src={qrUrl!} alt="QR thanh toán" style={{ maxWidth: '100%', borderRadius: 8 }} />
                                    </div>
                                    <Text strong>Nội dung: {paymentCode}</Text>
                                    <Text>{accountName}</Text>
                                    <Text type="secondary">{bankCode} | {accountNumber}</Text>
                                </Space>
                            ) : (
                                <Result
                                    icon={<CheckCircleOutlined style={{ color: '#faad14' }} />}
                                    title="Đang chờ chủ sân cấu hình ngân hàng"
                                    subTitle="Chủ sân cần liên kết tài khoản trong SePay Bank Hub trước khi khách có thể thanh toán tự động."
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

function CenteredResult({ status, title, subTitle, extra }: any) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <Card className="max-w-lg w-full shadow-lg rounded-xl text-center">
                <Result status={status} title={title} subTitle={subTitle} extra={extra} />
            </Card>
        </div>
    );
}
