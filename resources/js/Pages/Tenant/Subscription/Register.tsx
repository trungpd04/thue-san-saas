import React, { useState } from 'react';
import { Head } from "@inertiajs/react";
import { Card, Button, Row, Col, Typography, Tag, Space, Divider, InputNumber, Steps, Result, Alert, message } from "antd";
import { CheckCircleOutlined, CreditCardOutlined, InfoCircleOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import TenantLayout from "@/Layout/Tenant/TenantLayout";
import axios from 'axios';
import { App, message as antMessage } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface Plan {
    id: number;
    name: string;
    price_monthly: string | number;
    max_fields: number;
    max_staff: number;
}

export default function Register({ plans = [], currentSubscription }: { plans: Plan[], currentSubscription: any }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [months, setMonths] = useState(1);
    const [loading, setLoading] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState<any>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    const { message } = App.useApp(); 

    const handleCreateRequest = async (plan: Plan) => {
        setSelectedPlan(plan);
        setLoading(true);
        try {
            const response = await axios.post('/tenant/subscription/register', {
                plan_id: plan.id,
                months: months
            });
            if (response.data.success) {
                setPaymentInfo(response.data);
                setCurrentStep(1);
            }
        } catch (err) {
            console.error(err);
            message.error('Có lỗi xảy ra, vui lòng thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <Head title="Đăng ký gói dịch vụ" />

            <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>Nâng cấp gói dịch vụ</Title>

            <Steps
                current={currentStep}
                style={{ marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}
                items={[
                    { title: 'Chọn gói', icon: <CheckCircleOutlined /> },
                    { title: 'Thanh toán', icon: <CreditCardOutlined /> },
                ]}
            />

            {currentStep === 0 ? (
                <>
                    <Row gutter={[24, 24]}>
                        {plans.map((plan) => {
                            const isCurrent = currentSubscription?.plan_id === plan.id;
                            const price = Number(plan.price_monthly);
                            
                            return (
                                <Col xs={24} sm={12} md={8} key={plan.id}>
                                    <Card 
                                        hoverable 
                                        style={{ 
                                            borderRadius: 12,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: isCurrent ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                        }}
                                        title={
                                            <Space>
                                                <span style={{ fontWeight: 'bold' }}>{plan.name}</span>
                                                {isCurrent && <Tag color="blue">Đang dùng</Tag>}
                                            </Space>
                                        }
                                    >
                                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                                                {formatCurrency(price)}
                                            </Title>
                                            <Text type="secondary">/ tháng</Text>
                                        </div>

                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flexGrow: 1 }}>
                                            <li style={{ marginBottom: 12 }}>
                                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                                Tối đa <strong>{plan.max_fields}</strong> sân
                                            </li>
                                            <li style={{ marginBottom: 12 }}>
                                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                                Tối đa <strong>{plan.max_staff}</strong> nhân viên
                                            </li>
                                        </ul>

                                        <div style={{ marginBottom: 16 }}>
                                            <Text type="secondary">Thời gian (tháng):</Text>
                                            <InputNumber 
                                                min={1} max={36} 
                                                value={months} 
                                                onChange={(val) => setMonths(val || 1)} 
                                                style={{ width: '100%', marginTop: 4 }}
                                            />
                                        </div>

                                        <Button 
                                            type="primary" 
                                            block 
                                            size="large"
                                            loading={loading && selectedPlan?.id === plan.id}
                                            onClick={() => handleCreateRequest(plan)}
                                            style={{ borderRadius: 8, fontWeight: 'bold' }}
                                        >
                                            Đăng ký ngay
                                        </Button>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </>
            ) : (
                <Card style={{ maxWidth: 800, margin: '0 auto', borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                    <Row>
                        <Col xs={24} md={12} style={{ background: '#001529', padding: 40, textAlign: 'center' }}>
                            <div style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'inline-block', marginBottom: 20 }}>
                                <img src={paymentInfo.payment_url} alt="QR" style={{ width: 200, height: 200 }} />
                            </div>
                            <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Quét mã VietQR</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Sử dụng ứng dụng Ngân hàng để quét</Text>
                        </Col>
                        
                        <Col xs={24} md={12} style={{ padding: 40 }}>
                            <Title level={4}>Chi tiết thanh toán</Title>
                            <Divider style={{ margin: '16px 0' }} />
                            
                            <Space direction="vertical" style={{ width: '100%' }} size="large">
                                <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>NỘI DUNG CHUYỂN KHOẢN</Text>
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Text strong style={{ fontSize: 18, color: '#1890ff', letterSpacing: 1 }}>
                                            {paymentInfo.transaction_ref}
                                        </Text>
                                        <Button 
                                            type="link" 
                                            icon={<CopyOutlined />} 
                                            onClick={() => {
                                                navigator.clipboard.writeText(paymentInfo.transaction_ref);
                                                message.success('Đã sao chép');
                                            }}
                                        >
                                            Sao chép
                                        </Button>
                                    </Space>
                                </div>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Text type="secondary">Số tiền</Text>
                                        <div style={{ fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(paymentInfo.amount)}</div>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary">Số tháng</Text>
                                        <div style={{ fontSize: 18, fontWeight: 'bold' }}>{months} tháng</div>
                                    </Col>
                                </Row>

                                <Alert
                                    message="Lưu ý"
                                    description="Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống kích hoạt tự động."
                                    type="warning"
                                    showIcon
                                />

                                <Space style={{ width: '100%', marginTop: 20 }}>
                                    <Button onClick={() => setCurrentStep(0)} block>Quay lại</Button>
                                    <Button 
                                        type="primary" 
                                        icon={<CheckOutlined />}
                                        onClick={() => window.location.href = '/tenant/subscription/status'}
                                        block
                                    >
                                        Đã chuyển khoản
                                    </Button>
                                </Space>
                            </Space>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}

Register.layout = (page: React.ReactNode) => (
<App>
    <TenantLayout children={page} />
</App>
);