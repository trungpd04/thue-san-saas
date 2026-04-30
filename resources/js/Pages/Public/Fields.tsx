import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Typography, Tag, Space, Divider, Row, Col } from 'antd';
import { EnvironmentOutlined, UserOutlined, TagOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function Fields({ fields }: any) {

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Danh sách sân" />

            {/* Header Section */}
            <div className="bg-white shadow-sm mb-8" style={{ background: '#fff', padding: '24px 0', marginBottom: 32 }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Hệ thống Sân Thể Thao</Title>
                        <Text type="secondary">Khám phá và đặt sân dễ dàng từ các đối tác của chúng tôi</Text>
                    </div>
                    {/* <Link href="/admin/login">
                        <Button type="default">Dành cho chủ sân</Button>
                    </Link> */}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                {fields.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 8 }}>
                        <Text type="secondary" style={{ fontSize: 18 }}>Hiện tại chưa có sân nào được đăng ký.</Text>
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {fields.map((field: any) => (
                            <Col xs={24} sm={12} lg={8} key={field.id}>
                                <Card
                                    hoverable
                                    style={{ height: '100%' }}
                                    bodyStyle={{ padding: '20px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{field.field_type?.name || 'Sân thể thao'}</Title>
                                    </div>

                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {field.description && (
                                            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                                                {field.description}
                                            </Paragraph>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <EnvironmentOutlined style={{ color: '#aaa', marginTop: 4 }} />
                                            <Text>{field.location || 'Chưa cập nhật địa chỉ'}</Text>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />

                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}>Thông tin chủ sân</Text>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                <div style={{ background: '#f5f5f5', padding: 8, borderRadius: '50%' }}>
                                                    <UserOutlined style={{ color: '#888' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{field.tenant?.name || 'Không rõ'}</div>
                                                    {field.tenant?.phone && <Text type="secondary" style={{ fontSize: 14 }}>{field.tenant.phone}</Text>}
                                                </div>
                                            </div>
                                        </div>

                                        <Link href={`/san/tenant/${field.tenant?.id}/booking?field_type_id=${field.field_type?.id}`} style={{ width: '100%', marginTop: 16 }}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                style={{ width: '100%', fontWeight: 600, height: 48 }}
                                            >
                                                Xem lịch & Đặt Sân
                                            </Button>
                                        </Link>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

        </div>
    );
}