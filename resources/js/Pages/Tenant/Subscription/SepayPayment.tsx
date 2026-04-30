import React, { useState, useEffect } from 'react';
import { Head, usePage } from "@inertiajs/react";
import { Card, Button, Row, Col, Typography, Space, Divider, Result, Alert, message, Spin, Statistic } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CopyOutlined, CheckOutlined, QrcodeOutlined } from "@ant-design/icons";
import TenantLayout from "@/Layout/Tenant/TenantLayout";
import axios from 'axios';

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

export default function SepayPayment({ payment, transaction_ref }: { payment: Payment; transaction_ref: string }) {
    const { tenancy } = usePage<SepayPaymentProps>().props;
    const [status, setStatus] = useState(payment?.status || 'pending');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const tenantBasePath = tenancy?.tenant?.slug ? `/tenant/${tenancy.tenant.slug}` : '/tenant';

    useEffect(() => {
        let interval: any;
        if (status === 'pending') {
            interval = setInterval(async () => {
                try {
                    setCheckingStatus(true);
                    const res = await axios.get(`${tenantBasePath}/subscription/check-status/${transaction_ref}`);
                    setStatus(res.data.status);
                    if (res.data.status === 'success' || res.data.status === 'paid') {
                        message.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
                        clearInterval(interval);
                        setTimeout(() => {
                            window.location.href = `${tenantBasePath}/subscription/status`;
                        }, 2000);
                    }
                } catch (e) {
                    console.error("Checking status error", e);
                } finally {
                    setCheckingStatus(false);
                }
            }, 3000); // Check mỗi 3 giây
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, transaction_ref, tenantBasePath]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép!');
    };

    const renderStatus = () => {
        switch (status) {
            case 'success':
            case 'paid':
                return (
                    <Result
                        status="success"
                        title="Thanh toán thành công!"
                        subTitle="Gói dịch vụ của bạn đã được kích hoạt. Hệ thống sẽ chuyển hướng trong giây lát."
                        extra={
                            <Button type="primary" href="/tenant/subscription/status">
                                Xem trạng thái
                            </Button>
                        }
                    />
                );
            case 'pending':
                return (
                    <div>
                        <Alert
                            message="Đang chờ thanh toán"
                            description="Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới."
                            type="info"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <TenantLayout>
            <Head title="Thanh toán SePay" />

            <div style={{ padding: '24px' }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Card title="Thông tin thanh toán" bordered>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text type="secondary">Gói dịch vụ:</Text>
                                    <Title level={4}>{payment?.subscription?.plan?.name}</Title>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Số tiền cần thanh toán:</Text>
                                    <Title level={3} style={{ color: '#1890ff' }}>
                                        {formatCurrency(payment?.amount)}
                                    </Title>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Mã giao dịch:</Text>
                                    <br />
                                    <Space>
                                        <Text code>{transaction_ref}</Text>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(transaction_ref)}
                                        />
                                    </Space>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Trạng thái:</Text>
                                    <br />
                                    {status === 'pending' && (
                                        <Space>
                                            <ClockCircleOutlined style={{ color: '#faad14' }} />
                                            <Spin size="small" />
                                            <Text>Đang chờ thanh toán...</Text>
                                        </Space>
                                    )}
                                    {(status === 'success' || status === 'paid') && (
                                        <Space>
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            <Text>Thanh toán thành công!</Text>
                                        </Space>
                                    )}
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <Space>
                                    <QrcodeOutlined />
                                    Mã QR thanh toán
                                </Space>
                            }
                            bordered
                        >
                            {renderStatus()}
                            {status === 'pending' && (
                                <div style={{ textAlign: 'center', marginTop: 24 }}>
                                    <img
                                        src={`https://qr.sepay.vn/img?acc=0865172698&bank=MB&amount=${payment?.amount}&des=${transaction_ref}&template=compact`}
                                        alt="QR Code"
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                    <Paragraph style={{ marginTop: 16, color: '#666' }}>
                                        Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán
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
