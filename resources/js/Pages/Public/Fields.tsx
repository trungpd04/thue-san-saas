import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Typography, Tag, Space, Divider, Row, Col, message, Modal, Select, Switch, Empty, Input, Drawer } from 'antd';
import { EnvironmentOutlined, UserOutlined, TagOutlined, CompassOutlined, GlobalOutlined, FilterOutlined, SearchOutlined, CheckCircleFilled, ControlOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import MapPicker from '../../Components/Common/MapPicker';

const { Title, Text, Paragraph } = Typography;

export default function Fields({ fields, fieldTypes, filters }: any) {
    const [loadingLocation, setLoadingLocation] = React.useState(false);
    const [mapModalVisible, setMapModalVisible] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<{ lat: number, lng: number } | null>(
        filters?.lat && filters?.lng ? { lat: Number(filters.lat), lng: Number(filters.lng) } : null
    );
    const [selectedFieldName, setSelectedFieldName] = React.useState('');
    const [selectedFieldType, setSelectedFieldType] = React.useState<number | null>(
        filters?.field_type_id ? Number(filters.field_type_id) : null
    );
    const [isNearMeActive, setIsNearMeActive] = React.useState(!!(filters?.lat && filters?.lng));
    const [searchTerm, setSearchTerm] = React.useState(filters?.name || '');
    const [showFilters, setShowFilters] = React.useState(false);
    const [isFirstLoad, setIsFirstLoad] = React.useState(true);

    React.useEffect(() => {
        if (isFirstLoad) {
            setIsFirstLoad(false);
            return;
        }
        const timer = setTimeout(() => {
            handleFilterSubmit();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Remove automatic search on mount to respect user preference for manual interaction


    const handleFilterSubmit = () => {
        const query: any = {};
        if (selectedFieldType) query.field_type_id = selectedFieldType;
        if (searchTerm) query.name = searchTerm;
        if (isNearMeActive && selectedLocation) {
            query.lat = selectedLocation.lat;
            query.lng = selectedLocation.lng;
        }

        router.get('/san', query, { preserveState: true });
    };

    const handleNearMeToggle = (checked: boolean) => {
        setIsNearMeActive(checked);
        if (checked && !selectedLocation) {
            setLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSelectedLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoadingLocation(false);
                },
                (error) => {
                    setIsNearMeActive(false);
                    setLoadingLocation(false);
                    message.error('Không thể lấy vị trí. Vui lòng bật định vị trên trình duyệt.');
                }
            );
        }
    };

    const showOnMap = (field: any) => {
        if (!field.latitude || !field.longitude) {
            message.warning('Sân này chưa cập nhật vị trí trên bản đồ.');
            return;
        }
        setSelectedLocation({
            lat: parseFloat(field.latitude),
            lng: parseFloat(field.longitude)
        });
        setSelectedFieldName(field.tenant?.name || 'Sân thể thao');
        setMapModalVisible(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Head title="Danh sách sân" />

            <div className="bg-white shadow-sm mb-8" style={{ background: '#fff', padding: '20px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#A0D911' }} />}
                            placeholder="Nhập tên câu lạc bộ / trung tâm..."
                            size="large"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ borderRadius: 8, height: 48, flex: 1 }}
                        />
                        <Button
                            size="large"
                            icon={<ControlOutlined />}
                            onClick={() => setShowFilters(true)}
                            style={{
                                height: 48,
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            Bộ lọc
                        </Button>
                        <Link href="/san/huong-dan-huy">
                            <Button
                                size="large"
                                type="default"
                                danger
                                style={{
                                    height: 48,
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 500
                                }}
                            >
                                Hủy lịch đặt
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Bộ lọc tìm kiếm</span>
                        <ReloadOutlined
                            style={{ color: '#A0D911', cursor: 'pointer' }}
                            onClick={() => {
                                setSelectedFieldType(null);
                                setIsNearMeActive(false);
                            }}
                        />
                    </div>
                }
                placement="right"
                onClose={() => setShowFilters(false)}
                open={showFilters}
                width={350}
            >
                <div style={{ padding: '0 4px' }}>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 16 }}>Loại sân / Môn thể thao</Typography.Text>
                    <Space wrap size={[8, 8]}>
                        <Tag.CheckableTag
                            checked={selectedFieldType === null}
                            onChange={() => setSelectedFieldType(null)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 20,
                                border: '1px solid #d9d9d9',
                                backgroundColor: selectedFieldType === null ? '#fafff0' : '#fff',
                                color: selectedFieldType === null ? '#000' : 'rgba(0,0,0,0.45)',
                                fontWeight: selectedFieldType === null ? 600 : 400
                            }}
                        >
                            Tất cả
                        </Tag.CheckableTag>
                        {fieldTypes.map((type: any) => (
                            <Tag.CheckableTag
                                key={type.id}
                                checked={selectedFieldType === type.id}
                                onChange={() => setSelectedFieldType(type.id)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 20,
                                    border: selectedFieldType === type.id ? '1px solid #A0D911' : '1px solid #d9d9d9',
                                    backgroundColor: selectedFieldType === type.id ? '#fafff0' : '#fff',
                                    color: selectedFieldType === type.id ? '#000' : 'rgba(0,0,0,0.45)',
                                    fontWeight: selectedFieldType === type.id ? 600 : 400
                                }}
                            >
                                {type.name}
                            </Tag.CheckableTag>
                        ))}
                    </Space>

                    <Divider style={{ margin: '24px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                        <Typography.Text strong>Ưu tiên sân gần tôi nhất</Typography.Text>
                        <Switch
                            checked={isNearMeActive}
                            onChange={handleNearMeToggle}
                            loading={loadingLocation}
                            style={{ backgroundColor: isNearMeActive ? '#A0D911' : '' }}
                        />
                    </div>

                    <div style={{ marginTop: 40 }}>
                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={() => {
                                handleFilterSubmit();
                                setShowFilters(false);
                            }}
                            style={{
                                height: 48,
                                borderRadius: 8,
                                backgroundColor: '#A0D911',
                                borderColor: '#A0D911',
                                fontWeight: 600
                            }}
                        >
                            Áp dụng
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* Main Content */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                {fields.length === 0 ? (
                    <Empty description="Không tìm thấy sân phù hợp với yêu cầu của bạn" style={{ marginTop: 80 }} />
                ) : (
                    <Row gutter={[24, 24]}>
                        {fields.map((field: any) => (
                            <Col xs={24} sm={12} lg={8} key={`${field.tenant_id}_${field.field_type?.id}`}>
                                <Card
                                    hoverable
                                    style={{ borderRadius: 16, overflow: 'hidden' }}
                                    bodyStyle={{ padding: '20px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <Title level={4} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>{field.field_type?.name}</Title>
                                            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 14 }}>
                                                {field.tenant?.name}
                                            </Text>
                                        </div>
                                        {field.distance !== null && (
                                            <div style={{ textAlign: 'right' }}>
                                                <Tag color="green" style={{ borderRadius: 12, margin: 0 }}>
                                                    {field.distance} km
                                                </Tag>
                                            </div>
                                        )}
                                    </div>

                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                <EnvironmentOutlined style={{ color: '#A0D911', marginTop: 4 }} />
                                                <Text style={{ color: '#595959' }}>{field.location || 'Chưa cập nhật địa chỉ'}</Text>
                                            </div>
                                            {(field.latitude && field.longitude) && (
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<GlobalOutlined />}
                                                    onClick={() => showOnMap(field)}
                                                    style={{ padding: 0, height: 'auto', color: '#A0D911' }}
                                                >
                                                    Bản đồ
                                                </Button>
                                            )}
                                        </div>

                                        <Divider style={{ margin: '8px 0' }} />

                                        <Link href={`/san/tenant/${field.tenant?.id}/booking?field_type_id=${field.field_type?.id}`} style={{ width: '100%' }}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                block
                                                style={{
                                                    borderRadius: 12,
                                                    fontWeight: 600,
                                                    height: 48,
                                                    background: 'linear-gradient(135deg, #A0D911, #86b30e)',
                                                    border: 'none'
                                                }}
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

            <Modal
                title={`Vị trí: ${selectedFieldName}`}
                open={mapModalVisible}
                onCancel={() => setMapModalVisible(false)}
                footer={null}
                width={800}
                centered
            >
                {selectedLocation && (
                    <div style={{ marginTop: 16 }}>
                        <MapPicker
                            height="450px"
                            value={selectedLocation}
                        // Không cho phép thay đổi tọa độ từ phía khách hàng
                        />
                        <div style={{ textAlign: 'right', marginTop: 16 }}>
                            <Button
                                type="primary"
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`}
                                target="_blank"
                            >
                                Chỉ đường trên Google Maps
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}