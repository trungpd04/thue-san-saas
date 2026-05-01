import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage } from "@inertiajs/react";
import { Card, Button, Row, Col, Typography, Space, Divider, Result, Alert, Spin, Statistic, App } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CopyOutlined, QrcodeOutlined } from "@ant-design/icons";
import TenantLayout from "@/Layout/Tenant/TenantLayout";
import axios from 'axios';
import { formatVND, normalizeVNDAmount } from '@/utils/currency';

const { Title, Text, Paragraph } = Typography;

interface Payment {
    id: number;
    transaction_ref: string;
    amount: number;
    status: string;
    subscription: {
        plan: {
            name: string;
        };
    };
}

type SepayPaymentProps = {
    tenancy?: {
        tenant?: {
            slug?: string;
        } | null;
    };
};

export default function SepayPayment({
    payment,
    transaction_ref,
    sepay_config
}: {
    payment: Payment;
    transaction_ref: string;
    sepay_config: {
        bank_account: string;
        bank_id: string;
    }
}) {
    const { tenancy } = usePage<SepayPaymentProps>().props;
    const tenantBasePath = tenancy?.tenant?.slug ? `/tenant/${tenancy.tenant.slug}` : '/tenant';

    const [status, setStatus] = useState(payment?.status || 'pending');
    const [checkingStatus, setCheckingStatus] = useState(false);

    const { message } = App.useApp();

    const EXPIRE_TIME = 5 * 60 * 1000;
    const expiredAtRef = useRef(Date.now() + EXPIRE_TIME);

    const bankAccount = sepay_config?.bank_account;
    const bankId = sepay_config?.bank_id;

    // ✅ Polling check status
    useEffect(() => {
        if (status !== 'pending') return;

        const interval = setInterval(async () => {
            try {
                setCheckingStatus(true);
                const res = await axios.get(`${tenantBasePath}/subscription/check-status/${transaction_ref}`);

                setStatus(prev => {
                    if (prev !== res.data.status) {
                        return res.data.status;
                    }
                    return prev;
                });

                if (res.data.status === 'success' || res.data.status === 'paid') {
                    message.success('Thanh toán thành công!');
                    clearInterval(interval);

                    setTimeout(() => {
                        window.location.href = `${tenantBasePath}/subscription/status`;
                    }, 2000);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setCheckingStatus(false);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [transaction_ref, tenantBasePath, status]);

    // ✅ Auto cancel
    const handleAutoCancel = async () => {
        if (status !== 'pending') return;

        try {
            await axios.post(`${tenantBasePath}/subscription/cancel`, { ref: transaction_ref });
            message.warning("Đã hết thời gian thanh toán (5 phút).");
        } catch (e) {}

        window.location.href = `${tenantBasePath}/subscription/register`;
    };

    // ✅ Format time
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getTimeLeft = () => {
        const diff = expiredAtRef.current - Date.now();
        return diff > 0 ? Math.floor(diff / 1000) : 0;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép!');
    };

    const renderStatus = () => {
        if (status === 'success' || status === 'paid') {
            return (
                <Result
                    status="success"
                    title="Thanh toán thành công!"
                    subTitle="Gói dịch vụ đã được kích hoạt."
                    extra={
                        <Button type="primary" href={`${tenantBasePath}/subscription/status`}>
                            Xem trạng thái
                        </Button>
                    }
                />
            );
        }

        return (
            <Alert
                message="Đang chờ thanh toán"
                description="Vui lòng quét QR hoặc chuyển khoản."
                type="info"
                showIcon
            />
        );
    };

    return (
        <TenantLayout>
            <Head title="Thanh toán SePay" />

            <Card title="Trạng thái thanh toán">
                {status === 'pending' && (
                    <div style={{ textAlign: 'center' }}>
                        <Statistic.Countdown
                            title="Thời gian còn lại"
                            value={expiredAtRef.current}
                            onFinish={() => handleAutoCancel()}
                            format="mm:ss"
                        />

                        <Text type="secondary">
                            Hoàn tất thanh toán trong 5 phút.
                        </Text>
                    </div>
                )}
            </Card>

            <div style={{ padding: 24 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Card title="Thông tin thanh toán">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text type="secondary">Gói:</Text>
                                    <Title level={4}>{payment?.subscription?.plan?.name}</Title>
                                </div>

                                <Divider />

                                <div>
                                    <Text type="secondary">Số tiền:</Text>
                                    <Title level={3} style={{ color: '#1890ff' }}>
                                        {formatVND(payment?.amount)}
                                    </Title>
                                </div>

                                {status === 'pending' && (
                                    <Alert
                                        type="warning"
                                        message={
                                            <Space>
                                                <ClockCircleOutlined />
                                                <span>
                                                    Còn lại: <strong>{formatTime(getTimeLeft())}</strong>
                                                </span>
                                            </Space>
                                        }
                                    />
                                )}

                                <Divider />

                                <div>
                                    <Text type="secondary">Mã giao dịch:</Text>
                                    <Space>
                                        <Text code>{transaction_ref}</Text>
                                        <Button
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(transaction_ref)}
                                        />
                                    </Space>
                                </div>

                                <Divider />

                                <div>
                                    {status === 'pending' && (
                                        <Space>
                                            <Spin size="small" />
                                            <Text>Đang chờ...</Text>
                                        </Space>
                                    )}
                                    {(status === 'success' || status === 'paid') && (
                                        <Space>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            <Text>Thành công</Text>
                                        </Space>
                                    )}
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card title="QR Thanh toán">
                            {renderStatus()}

                            {status === 'pending' && (
                                <div style={{ textAlign: 'center', marginTop: 24 }}>
                                    <img
                                        src={`https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankId}&amount=${normalizeVNDAmount(payment?.amount)}&des=${transaction_ref}&template=compact`}
                                        alt="QR"
                                        style={{ maxWidth: '100%' }}
                                    />
                                    <Paragraph>
                                        Quét QR bằng app ngân hàng
                                    </Paragraph>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </TenantLayout>
    );
}