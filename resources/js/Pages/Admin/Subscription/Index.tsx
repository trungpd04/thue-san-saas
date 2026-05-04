import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Card, Button, Row, Col, Typography, Tag, Space, message, Divider, Descriptions, InputNumber } from "antd";
import { CheckCircleOutlined, ShopOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AdminLayout from "@/Layout/Admin/AdminLayout";
const { Title, Text } = Typography;

interface Plan {
    id: number;
    name: string;
    price_monthly: string;
    max_fields: number;
    max_staff: number; 
}

interface Props {
    plans: Plan[];
    currentSubscription: any;
    tenant: any;
}

export default function SubscriptionIndex({ plans = [], currentSubscription, tenant }: Props) {
    const [months, setMonths] = useState<Record<number, number>>(
        plans.reduce((acc, plan) => ({ ...acc, [plan.id]: 1 }), {})
    );
    
    if (!tenant) {
        return <div style={{ padding: 24 }}>Đang tải thông tin tenant...</div>;
    }
    
    const handleSubscribe = (planId: number) => {
        router.post(
            `/admin/tenant/${tenant.slug}/subscription`,
            {
                plan_id: planId,
                months: months[planId] || 1,
            },
            {
                onSuccess: () => message.success(`Đã cập nhật gói thành công cho ${tenant.name}`),
                onError: () => message.error('Có lỗi xảy ra, vui lòng thử lại sau')
            }
        );
    };

    const handleMonthChange = (planId: number, value: number | null) => {
        setMonths(prev => ({ ...prev, [planId]: value || 1 }));
    };

    return (
        <div style={{ padding: '24px' }}>
            <Head title={`Gói dịch vụ - ${tenant.name}`} />
            
            <div style={{ marginBottom: 24 }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => window.history.back()}
                    style={{ marginBottom: 16 }}
                >
                    Quay lại danh sách
                </Button>
                <Title level={2}>Quản lý gói cước</Title>
            </div>

            {/* Thông tin Tenant hiện tại */}
            <Card style={{ marginBottom: 32, borderRadius: 12, border: '1px solid #d9d9d9' }}>
                <Space align="start" size="middle">
                    <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 8 }}>
                        <ShopOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>{tenant.name}</Title>
                        <Text type="secondary">Slug: {tenant.slug}</Text>
                    </div>
                </Space>
                <Divider style={{ margin: '16px 0' }} />
                <Descriptions column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Gói hiện tại">
                        {currentSubscription ? (
                            <Tag color="blue" style={{ fontSize: 14 }}>{currentSubscription.plan.name}</Tag>
                        ) : (
                            <Tag color="default">Chưa có gói</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày hết hạn">
                        <Text strong>
                            {currentSubscription?.ends_at 
                                ? new Date(currentSubscription.ends_at).toLocaleDateString('vi-VN') 
                                : 'Vĩnh viễn'}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Row gutter={[24, 24]}>
                {plans.map((plan) => {
                    const isCurrent = currentSubscription?.plan_id === plan.id;
                    const selectedMonths = months[plan.id] || 1;
                    const totalPrice = Number(plan.price_monthly) * selectedMonths;

                    return (
                        <Col xs={24} sm={12} md={8} key={plan.id}>
                            <Card 
                                hoverable 
                                style={{ 
                                    border: isCurrent ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                    borderRadius: 12,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                title={
                                    <Space>
                                        <span style={{ fontWeight: 'bold' }}>{plan.name}</span>
                                        {isCurrent && <Tag color="blue">Hiện tại</Tag>}
                                    </Space>
                                }
                            >
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                                        {new Intl.NumberFormat('vi-VN', { 
                                            style: 'currency', 
                                            currency: 'VND' 
                                        }).format(Number(plan.price_monthly))}
                                    </Title>
                                    <Text type="secondary">/ tháng</Text>
                                </div>

                                <div style={{ marginBottom: 24, flexGrow: 1 }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        <li style={{ marginBottom: 8 }}>
                                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            Tối đa <strong>{plan.max_fields}</strong> sân
                                        </li>
                                        <li style={{ marginBottom: 8 }}>
                                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            Tối đa <strong>{plan.max_staff}</strong> nhân viên
                                        </li>
                                    </ul>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />
                                
                                <div style={{ marginBottom: 16 }}>
                                    <Text type="secondary">Số tháng đăng ký:</Text>
                                    <div style={{ marginTop: 8 }}>
                                        <InputNumber 
                                            min={1} 
                                            max={36} 
                                            value={selectedMonths} 
                                            onChange={(val) => handleMonthChange(plan.id, val)} 
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 8, textAlign: 'right' }}>
                                        <Text type="secondary">Tổng tiền: </Text>
                                        <Text strong style={{ color: '#ff4d4f' }}>
                                            {new Intl.NumberFormat('vi-VN', { 
                                                style: 'currency', 
                                                currency: 'VND' 
                                            }).format(totalPrice)}
                                        </Text>
                                    </div>
                                </div>

                                <Button 
                                    type={isCurrent ? "default" : "primary"} 
                                    block 
                                    size="large"
                                    onClick={() => handleSubscribe(plan.id)}
                                    style={{ 
                                        borderRadius: 8,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isCurrent ? 'Cập nhật thời hạn' : 'Gán gói này'}
                                </Button>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
}

SubscriptionIndex.layout = (page: React.ReactNode) => <AdminLayout children={page} />;
