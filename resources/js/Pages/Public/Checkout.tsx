import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Alert, App, Button, Card, Col, Descriptions, Divider, Result, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, BankOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { formatVND } from '@/utils/currency';

const { Title, Text, Paragraph } = Typography;

type CheckoutBooking = {
    id: number;
    code: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    base_price: number;
    event_surcharge_amount: number;
    total_price: number;
    pricing_breakdown?: Array<{ start_time?: string; end_time?: string; price?: number; field_id?: number }>;
    status: string;
    locked_at?: string | null;
    created_at?: string | null;
    note?: string | null;
    customer?: {
        name?: string | null;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
    };
    field?: {
        name?: string | null;
        location?: string | null;
        description?: string | null;
        field_type?: {
            name?: string | null;
        };
    };
    special_event?: {
        title?: string | null;
        effect?: string | null;
        surge_percent?: number | null;
    } | null;
    payment?: {
        amount: number;
        payment_method: string;
        type?: string | null;
        status: string;
        paid_at?: string | null;
        note?: string | null;
    } | null;
};

type CheckoutProps = {
    bookings: CheckoutBooking[];
    tenant: {
        id: string;
        name: string;
        phone?: string | null;
        address?: string | null;
    };
    payment: {
        code: string;
        amount: number;
        bank_account?: Record<string, any> | null;
        error?: string | null;
        webhook_url?: string;
        webhook_token?: string | null;
    };
};

const paidStatuses = ['paid', 'confirmed'];

export default function Checkout({ bookings, tenant, payment }: CheckoutProps) {
    return (
        <App>
            <CheckoutContent bookings={bookings} tenant={tenant} payment={payment} />
        </App>
    );
}

function CheckoutContent({ bookings, tenant, payment }: CheckoutProps) {
    const [currentBookings, setCurrentBookings] = useState(bookings);
    const [isExpired, setIsExpired] = useState(false);
    const [isPaid, setIsPaid] = useState(() => bookings.every((booking) => paidStatuses.includes(booking.status)));
    const { message } = App.useApp();

    const firstBooking = currentBookings[0];
    const lockedAt = dayjs(firstBooking.locked_at || firstBooking.created_at);
    const deadline = lockedAt.add(5, 'minute').valueOf();
    const totalPrice = useMemo(
        () => currentBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0),
        [currentBookings],
    );
    const bookingIds = useMemo(() => currentBookings.map((booking) => booking.id).join(','), [currentBookings]);
    const customer = firstBooking.customer;

    const bankAccount = payment?.bank_account;
    const bankCode = bankAccount?.bank_id ?? bankAccount?.bank_code ?? bankAccount?.brand_name;
    const accountNumber = bankAccount?.account_number ?? bankAccount?.sub_account;
    const accountName = bankAccount?.account_holder_name ?? bankAccount?.sub_holder_name ?? tenant.name;
    const paymentCode = payment?.code ?? `BK${firstBooking.id}`;
    const canPay = !payment?.error && bankCode && accountNumber;
    const qrUrl = canPay
        ? `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${Math.round(totalPrice)}&addInfo=${encodeURIComponent(paymentCode)}&accountName=${encodeURIComponent(accountName)}`
        : null;

    useEffect(() => {
        if (isPaid || isExpired) return;

        const interval = window.setInterval(async () => {
            try {
                const response = await axios.get('/san/booking-status', {
                    params: { booking_ids: bookingIds },
                });

                if (Array.isArray(response.data.bookings)) {
                    setCurrentBookings(response.data.bookings);
                }

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
    }, [bookingIds, isPaid, isExpired, message]);

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
                    <Link href="/" key="home">
                        <Button size="large">Về danh sách sân</Button>
                    </Link>,
                ]}
            />
        );
    }

    if (isPaid) {
        return (
            <SuccessView
                bookings={currentBookings}
                tenant={tenant}
                totalPrice={totalPrice}
                paymentCode={paymentCode}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Thanh toán đặt sân" />

            <PageHeader tenant={tenant} title="Thanh toán đặt sân" />

            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
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
                        <BookingSummaryCard bookings={currentBookings} customer={customer} totalPrice={totalPrice} status="waiting" />

                        <Card variant="borderless" className="shadow-sm rounded-xl">
                            <Title level={4}><InfoCircleOutlined /> Hướng dẫn thanh toán</Title>
                            <Paragraph>1. Quét QR hoặc chuyển khoản đúng số tiền vào tài khoản của chủ sân.</Paragraph>
                            <Paragraph>2. Nội dung chuyển khoản phải là <Text code>{paymentCode}</Text>.</Paragraph>
                            <Paragraph>3. Sau khi SePay xác nhận giao dịch, trang này sẽ tự chuyển sang phiếu xác nhận đặt sân.</Paragraph>
                            <Alert
                                type="info"
                                showIcon
                                message="Không cần bấm xác nhận thủ công"
                                description="Trang tự kiểm tra trạng thái mỗi vài giây. Nếu quá 5 phút chưa có thanh toán, slot sẽ được giải phóng."
                            />
                        </Card>

                        {payment?.webhook_token && (
                            <Card variant="borderless" className="shadow-sm rounded-xl mt-6" style={{ background: '#fff7e6', border: '1px solid #ffe7ba' }}>
                                <Title level={4}>Developer Tools</Title>
                                <Paragraph>Dùng nút này để giả lập SePay gửi webhook thanh toán thành công. Chỉ hiển thị ở môi trường local.</Paragraph>
                                <Button
                                    type="primary"
                                    danger
                                    onClick={async () => {
                                        try {
                                            const res = await axios.post(payment.webhook_url!, {
                                                event_type: 'TRANSACTION_NEW',
                                                data: {
                                                    content: paymentCode,
                                                    amount_in: totalPrice,
                                                    transaction_id: 'SIM-' + Date.now(),
                                                    reference_number: 'REF' + Date.now(),
                                                },
                                            }, {
                                                headers: {
                                                    'X-Secret-Key': payment.webhook_token,
                                                    'Content-Type': 'application/json',
                                                },
                                            });
                                            message.success('Đã gửi giả lập webhook: ' + (res.data.message || 'Thành công'));
                                        } catch (err: any) {
                                            message.error('Lỗi giả lập: ' + (err.response?.data?.message || err.message));
                                        }
                                    }}
                                >
                                    Giả lập thanh toán thành công
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
                                    icon={<BankOutlined style={{ color: '#faad14' }} />}
                                    title="Đang chờ chủ sân cấu hình ngân hàng"
                                    subTitle="Chủ sân cần liên kết tài khoản SePay Bank Hub trước khi khách có thể thanh toán tự động."
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

function SuccessView({ bookings, tenant, totalPrice, paymentCode }: {
    bookings: CheckoutBooking[];
    tenant: CheckoutProps['tenant'];
    totalPrice: number;
    paymentCode: string;
}) {
    const firstBooking = bookings[0];
    const customer = firstBooking.customer;
    const payment = firstBooking.payment;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Đặt sân thành công" />
            <PageHeader tenant={tenant} title="Đặt sân thành công" />

            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
                <Card variant="borderless" className="shadow-sm rounded-xl" style={{ marginBottom: 24 }}>
                    <Result
                        status="success"
                        title="Thanh toán thành công"
                        subTitle="Đặt sân của bạn đã được xác nhận. Vui lòng lưu mã đặt sân để đối chiếu khi đến sân."
                        extra={[
                            <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} key="print">
                                In phiếu xác nhận
                            </Button>,
                            <Link href="/san" key="home">
                                <Button>Về danh sách sân</Button>
                            </Link>,
                        ]}
                    />
                </Card>

                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <BookingSummaryCard bookings={bookings} customer={customer} totalPrice={totalPrice} status="paid" />
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card variant="borderless" className="shadow-sm rounded-xl">
                            <Title level={4}>Thông tin xác nhận</Title>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Mã thanh toán">
                                    <Text code>{paymentCode}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color="green" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày thanh toán">
                                    {payment?.paid_at ? dayjs(payment.paid_at).format('HH:mm DD/MM/YYYY') : dayjs().format('HH:mm DD/MM/YYYY')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Phương thức">
                                    {payment?.payment_method || 'SePay Bank Hub'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Số tiền">
                                    <Text strong>{formatVND(payment?.amount || totalPrice)}</Text>
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider />

                            <Title level={5}>Chủ sân</Title>
                            <Space direction="vertical" size={2}>
                                <Text strong>{tenant.name}</Text>
                                {tenant.phone && <Text type="secondary">{tenant.phone}</Text>}
                                {tenant.address && <Text type="secondary">{tenant.address}</Text>}
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

function BookingSummaryCard({ bookings, customer, totalPrice, status }: {
    bookings: CheckoutBooking[];
    customer?: CheckoutBooking['customer'];
    totalPrice: number;
    status: 'waiting' | 'paid';
}) {
    const columns: ColumnsType<CheckoutBooking> = [
        {
            title: 'Sân',
            key: 'field',
            render: (_, booking) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{booking.field?.name}</Text>
                    <Text type="secondary">{booking.field?.field_type?.name || 'Chưa có loại sân'}</Text>
                    {booking.field?.location && <Text type="secondary">{booking.field.location}</Text>}
                </Space>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (_, booking) => (
                <Space direction="vertical" size={0}>
                    <Text>{dayjs(booking.booking_date).format('DD/MM/YYYY')}</Text>
                    <Text type="secondary">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</Text>
                </Space>
            ),
        },
        {
            title: 'Mã đặt',
            dataIndex: 'code',
            key: 'code',
            render: (code) => <Text code>{code}</Text>,
        },
        {
            title: 'Phụ thu',
            key: 'surcharge',
            align: 'right',
            render: (_, booking) => booking.event_surcharge_amount > 0 ? (
                <Space direction="vertical" size={0}>
                    <Text>{formatVND(booking.event_surcharge_amount)}</Text>
                    {booking.special_event?.title && <Text type="secondary">{booking.special_event.title}</Text>}
                </Space>
            ) : <Text type="secondary">Không có</Text>,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'total_price',
            key: 'total_price',
            align: 'right',
            render: (value) => <Text strong style={{ color: '#cf1322' }}>{formatVND(value)}</Text>,
        },
    ];

    return (
        <Card variant="borderless" className="shadow-sm rounded-xl mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ marginBottom: 4 }}>Chi tiết đặt sân</Title>
                    <Text type="secondary">
                        {status === 'paid' ? 'Thông tin đặt sân đã được xác nhận.' : 'Các slot này đang được giữ trong thời gian thanh toán.'}
                    </Text>
                </div>
                <Tag color={status === 'paid' ? 'green' : 'blue'} icon={status === 'paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
                    {status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </Tag>
            </div>

            <Descriptions column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 20 }}>
                <Descriptions.Item label="Khách hàng">
                    <Text strong>{customer?.name || 'Chưa có tên'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                    {customer?.phone || 'Chưa có'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                    {customer?.email || 'Chưa có'}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                    {customer?.address || 'Chưa có'}
                </Descriptions.Item>
            </Descriptions>

            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="id"
                pagination={false}
                scroll={{ x: 900 }}
            />

            <Divider />

            <Row justify="end">
                <Col xs={24} sm={12} md={8}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <SummaryLine label="Tiền sân" value={formatVND(bookings.reduce((sum, booking) => sum + Number(booking.base_price), 0))} />
                        <SummaryLine label="Phụ thu" value={formatVND(bookings.reduce((sum, booking) => sum + Number(booking.event_surcharge_amount), 0))} />
                        <Divider style={{ margin: '4px 0' }} />
                        <SummaryLine label="Tổng cộng" value={formatVND(totalPrice)} strong />
                    </Space>
                </Col>
            </Row>
        </Card>
    );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <Text strong={strong}>{label}</Text>
            <Text strong={strong} style={strong ? { color: '#cf1322', fontSize: 18 } : undefined}>{value}</Text>
        </div>
    );
}

function PageHeader({ tenant, title }: { tenant: CheckoutProps['tenant']; title: string }) {
    return (
        <div style={{ background: '#fff', padding: '24px 0', marginBottom: 32 }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href={`/san/tenant/${tenant.id}/booking`}>
                    <Button icon={<ArrowLeftOutlined />} shape="circle" />
                </Link>
                <div>
                    <Title level={3} style={{ margin: 0 }}>{title}</Title>
                    <Text type="secondary">{tenant.name}</Text>
                </div>
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

function formatTime(value?: string | null) {
    return value ? value.substring(0, 5) : '';
}
