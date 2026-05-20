import React, { useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Card, Form, Input, Button, Row, Col, Space, message, Typography } from 'antd';
import TenantLayout from '../../../Layout/Tenant/TenantLayout';
import MapPicker from '../../../Components/Common/MapPicker';

interface Tenant {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    slug: string;
}

interface PageProps {
    tenant: Tenant;
    flash: {
        success?: string;
    };
}

export default function Profile() {
    const { tenant, flash } = usePage<any>().props as PageProps;
    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        latitude: tenant.latitude ? Number(tenant.latitude) : null,
        longitude: tenant.longitude ? Number(tenant.longitude) : null,
    });

    useEffect(() => {
        if (flash.success) {
            message.success(flash.success);
        }
    }, [flash]);

    const handleSubmit = () => {
        put(`/tenant/${tenant.slug}/profile`);
    };

    const handleSearchAddress = async () => {
        if (!data.address) {
            message.warning('Vui lòng nhập địa chỉ trước khi tìm kiếm.');
            return;
        }

        try {
            message.loading({ content: 'Đang tìm kiếm vị trí...', key: 'searching' });
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}&limit=1`);
            const results = await response.json();

            if (results && results.length > 0) {
                const { lat, lon } = results[0];
                setData(prev => ({
                    ...prev,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon)
                }));
                message.success({ content: 'Đã tìm thấy vị trí trên bản đồ!', key: 'searching' });
            } else {
                message.error({ content: 'Không tìm thấy tọa độ cho địa chỉ này. Bạn có thể tự ghim trên bản đồ.', key: 'searching' });
            }
        } catch (error) {
            message.error({ content: 'Có lỗi xảy ra khi tìm kiếm vị trí.', key: 'searching' });
        }
    };

    return (
        <div>
            <Head title="Hồ sơ trung tâm" />
            <Typography.Title level={2}>Thông tin trung tâm</Typography.Title>
            
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={10}>
                    <Card title="Thông tin cơ bản" variant="borderless">
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <Form.Item 
                                label="Tên trung tâm" 
                                validateStatus={errors.name ? 'error' : ''}
                                help={errors.name}
                                required
                            >
                                <Input 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    placeholder="Tên sân/trung tâm"
                                />
                            </Form.Item>

                            <Form.Item 
                                label="Số điện thoại"
                                validateStatus={errors.phone ? 'error' : ''}
                                help={errors.phone}
                            >
                                <Input 
                                    value={data.phone || ''} 
                                    onChange={e => setData('phone', e.target.value)} 
                                    placeholder="Số điện thoại liên hệ"
                                />
                            </Form.Item>

                            <Form.Item 
                                label="Địa chỉ trung tâm"
                                validateStatus={errors.address ? 'error' : ''}
                                help={errors.address}
                                required
                            >
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input.TextArea 
                                        value={data.address || ''} 
                                        onChange={e => setData('address', e.target.value)} 
                                        rows={2}
                                        placeholder="Nhập địa chỉ chính xác để tìm trên bản đồ"
                                    />
                                    <Button 
                                        type="primary" 
                                        onClick={handleSearchAddress}
                                        style={{ height: 'auto' }}
                                    >
                                        Tìm trên bản đồ
                                    </Button>
                                </Space.Compact>
                            </Form.Item>

                            {/* Ẩn phần nhập tọa độ thủ công, chỉ hiển thị để xem */}
                            <div style={{ display: 'none' }}>
                                <Form.Item name="latitude"><Input /></Form.Item>
                                <Form.Item name="longitude"><Input /></Form.Item>
                            </div>

                            {data.latitude && data.longitude && (
                                <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                                    <Typography.Text type="success">
                                        ✓ Đã xác định tọa độ: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                                    </Typography.Text>
                                </div>
                            )}

                            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                                <Button type="primary" htmlType="submit" loading={processing} block size="large">
                                    Lưu thay đổi
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
                
                <Col xs={24} lg={14}>
                    <Card title="Ghim vị trí trên bản đồ" variant="borderless" style={{ height: '100%' }}>
                        <MapPicker 
                            height="500px"
                            value={data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : undefined}
                            onChange={(coords) => {
                                setData(prev => ({
                                    ...prev,
                                    latitude: coords.lat,
                                    longitude: coords.lng
                                }));
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

Profile.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
