import React, { useState, useMemo } from 'react';
import { Layout, Row, Col, Card, Typography, Badge, Button, Select, Tag, Empty, Divider } from 'antd';
import { FieldTimeOutlined, CalendarOutlined, RocketOutlined, CheckCircleFilled, StarFilled, PhoneOutlined, EnvironmentOutlined, FilterOutlined } from '@ant-design/icons';
import '../../../css/PublicLanding.css';

const { Title, Paragraph, Text } = Typography;
const { Content, Footer } = Layout;

export default function PublicLanding({ tenant, fields }: any) {
    const [activeTab, setActiveTab] = useState('all');

    const selectOptions = useMemo(() => {
        const uniqueTypes = Array.from(new Set(fields.map((f: any) => f.field_type_id)));
        return [
            { value: 'all', label: 'Tất cả sân' },
            ...uniqueTypes.map(id => ({
                value: String(id),
                label: fields.find((f: any) => f.field_type_id === id)?.field_type_name || 'Khác'
            }))
        ];
    }, [fields]);

    const filteredFields = useMemo(() => {
        let list = activeTab === 'all' ? fields : fields.filter((f: any) => String(f.field_type_id) === activeTab);
        const seen = new Set();
        return list.filter((f: any) => {
            if (seen.has(f.id)) return false;
            seen.add(f.id);
            return true;
        });
    }, [fields, activeTab]);

    return (
        <Layout className="lp-layout">
            <section className="hero-section">
                <div className="hero-overlay">
                    <Title level={1} className="hero-title">{tenant.name}</Title>
                    <Paragraph className="hero-desc">Hệ thống sân bãi hiện đại - Đặt lịch nhanh chóng - Trải nghiệm đẳng cấp.</Paragraph>
                    <Button type="primary" size="large" href="#facilities" className="btn-book">Khám phá sân ngay</Button>
                </div>
            </section>

            <section className="trust-section">
                <Row justify="center" gutter={[32, 32]}>
                    <Col xs={24} md={6}>
                        <RocketOutlined style={{ fontSize: 32, color: '#00b96b' }} />
                        <Title level={4}>Đặt lịch 1 chạm</Title>
                        <Text>Giữ sân nhanh chóng, xác nhận tức thì.</Text>
                    </Col>
                    <Col xs={24} md={6}>
                        <StarFilled style={{ fontSize: 32, color: '#00b96b' }} />
                        <Title level={4}>Dịch vụ tận tâm</Title>
                        <Text>Tiện ích đầy đủ: Nước, Locker, Bãi đỗ xe.</Text>
                    </Col>
                </Row>
            </section>

            <Content className="main-content" id="facilities">
                <Title level={2} style={{ textAlign: 'center', marginBottom: 20 }}>Danh sách sân hiện có</Title>

                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Select
                        defaultValue="all"
                        style={{ width: 280 }}
                        size="large"
                        onChange={(value) => setActiveTab(value)}
                        options={selectOptions}
                        prefix={<FilterOutlined />}
                        placeholder="Chọn loại sân"
                    />
                </div>
                <Row gutter={[24, 24]} style={{ marginTop: 20 }}>
                    {filteredFields.length > 0 ? filteredFields.map((field: any) => {
                        const isSpecial = field.specialEvents && field.specialEvents.length > 0;
                        return (
                            <Col key={field.id}>
                                <Card hoverable className={`field-card ${isSpecial ? 'highlight-card' : ''}`}>
                                    {isSpecial && <Badge.Ribbon text="Đang có sự kiện" color="volcano" />}

                                    <Title level={4}>{field.name}</Title>
                                    <Tag color={isSpecial ? "volcano" : "blue"} style={{ marginBottom: 15 }}>{field.field_type_name}</Tag>

                                    <Paragraph type="secondary" className="field-description" style={{ flexGrow: 1 }}>
                                        {field.description || 'Sân đạt chuẩn thi đấu, không gian thoáng mát.'}
                                    </Paragraph>

                                    <div className="card-footer-actions">
                                        <div className={`price-box ${isSpecial ? 'price-box-special' : ''}`}>
                                            <FieldTimeOutlined /> <strong>{field.price_per_hour ? `Từ: ${Number(field.price_per_hour).toLocaleString()}đ/giờ` : 'Liên hệ'}</strong>
                                        </div>
                                        <Button type={isSpecial ? "primary" : "default"} block href={`/san/tenant/${field.tenant_id}/booking`}>
                                            <CalendarOutlined /> {isSpecial ? 'Đặt sân ngay' : 'Xem lịch & Đặt sân'}
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        );
                    }) : <Empty description="Chưa có sân nào trong loại này" style={{ margin: '40px auto' }} />}
                </Row>
            </Content>

            <Footer className="lp-footer">
                <div style={{ maxWidth: 800, margin: 'auto' }}>
                    <p><PhoneOutlined /> Hotline: {tenant.phone || 'Đang cập nhật'}</p>
                    <p><EnvironmentOutlined /> Địa chỉ: {tenant.address || 'Đang cập nhật'}</p>
                    <Divider style={{ borderColor: '#333' }} />
                    <Text style={{ color: '#888' }}>{tenant.name} © 2026. Phát triển bởi hệ thống đặt sân chuyên nghiệp.</Text>
                </div>
            </Footer>
        </Layout>
    );
}