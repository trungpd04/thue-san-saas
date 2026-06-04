import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Col, Row, Space, Typography, Select, Alert, Timeline } from 'antd';
import { ArrowLeftOutlined, PhoneOutlined, InfoCircleOutlined, EnvironmentOutlined, QuestionCircleOutlined, CustomerServiceOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

type Tenant = {
    id: number;
    name: string;
    phone?: string | null;
    address?: string | null;
};

type CancellationProps = {
    tenants: Tenant[];
};

export default function Cancellation({ tenants }: CancellationProps) {
    const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(undefined);

    const selectedTenant = tenants.find(t => t.id === selectedTenantId);

    return (
        <div className="min-h-screen bg-gray-50 pb-12" style={{ background: '#f9fafb', minHeight: '100vh', paddingBottom: 48 }}>
            <Head title="Hướng dẫn hủy đặt sân" />

            {/* Header Section */}
            <div className="bg-white shadow-sm mb-8" style={{ background: '#fff', padding: '24px 0', marginBottom: 32, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/san">
                        <Button icon={<ArrowLeftOutlined />} shape="circle" size="large" />
                    </Link>
                    <div>
                        <Title level={2} style={{ margin: 0, fontSize: 24 }}>Hướng dẫn hủy đặt sân</Title>
                        <Text type="secondary">Tìm thông tin liên hệ của trung tâm để yêu cầu hoàn tiền hoặc đổi giờ</Text>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12, padding: 8 }}>
                            <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <QuestionCircleOutlined style={{ color: '#7cb305' }} /> Chọn sân thể thao đã đặt
                            </Title>
                            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                                Vui lòng chọn trung tâm/sân thể thao mà quý khách đã thực hiện đặt lịch trực tuyến:
                            </Paragraph>
                            <Select
                                showSearch
                                placeholder="Nhập tên hoặc chọn sân thể thao..."
                                optionFilterProp="children"
                                style={{ width: '100%', height: 44 }}
                                onChange={(value) => setSelectedTenantId(value)}
                                value={selectedTenantId}
                                allowClear
                            >
                                {tenants.map(t => (
                                    <Select.Option key={t.id} value={t.id}>
                                        {t.name}
                                    </Select.Option>
                                ))}
                            </Select>

                            {selectedTenant && (
                                <div style={{ 
                                    marginTop: 24, 
                                    padding: '24px 32px', 
                                    background: 'linear-gradient(135deg, #f6ffed 0%, #ebf8e3 100%)', 
                                    borderRadius: 12,
                                    border: '1px solid #d9f7be',
                                    boxShadow: '0 2px 8px rgba(124, 179, 5, 0.05)'
                                }}>
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>TRUNG TÂM / SÂN</Text>
                                            <Title level={3} style={{ margin: '4px 0 0 0', color: '#141414' }}>
                                                {selectedTenant.name}
                                            </Title>
                                        </div>

                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} md={12}>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <EnvironmentOutlined style={{ color: '#7cb305', fontSize: 18, marginTop: 3 }} />
                                                    <div>
                                                        <Text strong style={{ color: '#434343' }}>Địa chỉ:</Text>
                                                        <br />
                                                        <Text type="secondary">{selectedTenant.address || 'Chưa cập nhật địa chỉ'}</Text>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <PhoneOutlined style={{ color: '#7cb305', fontSize: 18, marginTop: 3 }} />
                                                    <div>
                                                        <Text strong style={{ color: '#434343' }}>Hotline hỗ trợ hủy lịch:</Text>
                                                        <br />
                                                        <Text strong style={{ fontSize: 18, color: '#7cb305' }}>
                                                            {selectedTenant.phone || 'Chưa cập nhật hotline'}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        {selectedTenant.phone && (
                                            <div style={{ marginTop: 8 }}>
                                                <Space size={12} wrap>
                                                    <Button 
                                                        type="primary" 
                                                        icon={<PhoneOutlined />} 
                                                        size="large"
                                                        href={`tel:${selectedTenant.phone}`}
                                                        style={{ 
                                                            background: '#7cb305', 
                                                            borderColor: '#7cb305', 
                                                            borderRadius: 8,
                                                            fontWeight: 600,
                                                            height: 48,
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        Gọi điện hỗ trợ ngay
                                                    </Button>
                                                    <Button 
                                                        type="default" 
                                                        icon={<MessageOutlined />} 
                                                        size="large"
                                                        href={`https://zalo.me/${selectedTenant.phone}`}
                                                        target="_blank"
                                                        style={{ 
                                                            color: '#0068ff',
                                                            borderColor: '#0068ff', 
                                                            borderRadius: 8,
                                                            fontWeight: 600,
                                                            height: 48,
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        Nhắn tin qua Zalo
                                                    </Button>
                                                </Space>
                                            </div>
                                        )}
                                    </Space>
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col span={24}>
                        <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                            <Title level={4} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CustomerServiceOutlined style={{ color: '#7cb305' }} /> Quy trình và chính sách hủy lịch đặt
                            </Title>
                            
                            <Timeline
                                items={[
                                    {
                                        color: '#7cb305',
                                        children: (
                                            <div>
                                                <Text strong>Bước 1: Chọn sân và lấy hotline liên hệ</Text>
                                                <Paragraph type="secondary" style={{ marginTop: 4 }}>
                                                    Lựa chọn sân thể thao bạn đã đặt ở mục phía trên để lấy số hotline liên hệ hỗ trợ.
                                                </Paragraph>
                                            </div>
                                        ),
                                    },
                                    {
                                        color: '#7cb305',
                                        children: (
                                            <div>
                                                <Text strong>Bước 2: Cung cấp thông tin đặt sân</Text>
                                                <Paragraph type="secondary" style={{ marginTop: 4 }}>
                                                    Gọi điện hoặc liên hệ qua Zalo của chủ sân, cung cấp **Họ và tên**, **Số điện thoại** đã đặt và **Khung giờ bóng lăn** để nhân viên hỗ trợ tra cứu lịch trên hệ thống.
                                                </Paragraph>
                                            </div>
                                        ),
                                    },
                                    {
                                        color: '#7cb305',
                                        children: (
                                            <div>
                                                <Text strong>Bước 3: Xác nhận hủy và hoàn trả tiền</Text>
                                                <Paragraph type="secondary" style={{ marginTop: 4 }}>
                                                    Nhân viên sẽ tiến hành hủy lịch trên trang quản lý để giải phóng sân. Tiền sân đã thanh toán sẽ được hoàn trả thủ công qua tài khoản ngân hàng của quý khách theo thỏa thuận.
                                                </Paragraph>
                                            </div>
                                        ),
                                    },
                                ]}
                            />

                            <Alert
                                message="Chính sách hoàn tiền quan trọng"
                                description={
                                    <ul style={{ paddingLeft: 16, margin: '8px 0 0 0' }}>
                                        <li>Quý khách vui lòng liên hệ yêu cầu hủy đặt sân trước giờ bóng lăn tối thiểu **6 tiếng** để được hỗ trợ tốt nhất.</li>
                                        <li>Tỷ lệ hoàn tiền và chính sách hoàn tiền có thể thay đổi tùy thuộc vào quy định cụ thể của từng chủ sân/trung tâm.</li>
                                        <li>Tiền hoàn trả sẽ được chủ sân thực hiện chuyển khoản lại trong vòng **24 giờ** kể từ khi xác nhận yêu cầu hủy thành công.</li>
                                    </ul>
                                }
                                type="info"
                                showIcon
                                icon={<InfoCircleOutlined style={{ color: '#096dd9' }} />}
                                style={{ marginTop: 8, borderRadius: 8 }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

Cancellation.layout = (page: React.ReactNode) => page;
