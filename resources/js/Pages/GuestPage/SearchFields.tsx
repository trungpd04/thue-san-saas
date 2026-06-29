import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Typography, Tag, Space, Divider, Row, Col, message, Modal, Select, Switch, Empty, Input, Drawer } from 'antd';
import { EnvironmentOutlined, UserOutlined, TagOutlined, CompassOutlined, GlobalOutlined, FilterOutlined, SearchOutlined, CheckCircleFilled, ControlOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import MapPicker from '../../Components/Common/MapPicker';
import '../../../css/pagenew.css';

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




    // const handleFilterSubmit = () => {
    //     const query: any = {};
    //     if (selectedFieldType) query.field_type_id = selectedFieldType;
    //     if (searchTerm) query.name = searchTerm;
    //     if (isNearMeActive && selectedLocation) {
    //         query.lat = selectedLocation.lat;
    //         query.lng = selectedLocation.lng;
    //     }

    //     // router.get('/san', query, { preserveState: true });
    //     router.get('/', query, { 
    //     preserveState: true, 
    //     preserveScroll: true 
    // });
    // };

    // Sửa hàm này thành nhận params
const handleFilterSubmit = (typeIdOverride?: number | null) => {
    const query: any = {};
    
    // Ưu tiên dùng giá trị truyền vào (nếu có), nếu không mới dùng State
    const typeId = typeIdOverride !== undefined ? typeIdOverride : selectedFieldType;
    
    if (typeId) query.field_type_id = typeId;
    if (searchTerm) query.name = searchTerm;
    if (isNearMeActive && selectedLocation) {
        query.lat = selectedLocation.lat;
        query.lng = selectedLocation.lng;
    }

    router.get('/san', query, { 
        preserveState: true, 
        preserveScroll: true 
    });
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
        <div className="landing-page">
            <section className="hero">
                <div className="hero-overlay">
                    <h1>Tìm sân thể thao phù hợp cho bạn</h1>
                    <p>
                        Đặt sân nhanh chóng, dễ dàng và tiện lợi
                    </p>

                    <div className="hero-search">
                        <Input
                            size="large"
                            prefix={<SearchOutlined />}
                            placeholder="Tìm sân, câu lạc bộ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <Button
                            type="primary"
                            size="large"
                            onClick={() => handleFilterSubmit()}
                        >
                            Tìm kiếm
                        </Button>
                    </div>
                </div>
            </section>

            <section className="filter-section">

                <div className="filter-header">

                    <div>
                        <h3>Bộ lọc nhanh</h3>
                        <p>Tìm sân phù hợp với nhu cầu của bạn</p>
                    </div>

                    <Button
                        className="filter-button"
                        icon={<FilterOutlined />}
                        onClick={() => setShowFilters(true)}
                    >
                        Bộ lọc nâng cao
                    </Button>

                </div>

                <div className="quick-filter-tags">

                    <Tag.CheckableTag
                        checked={selectedFieldType === null}
                        onChange={() => {
                            setSelectedFieldType(null);
                            setTimeout(() => handleFilterSubmit(null), 100);
                        }}
                    >
                        Tất cả
                    </Tag.CheckableTag>

                    {fieldTypes.map((type: any) => (
                        <Tag.CheckableTag
                            key={type.id}
                            checked={selectedFieldType === type.id}
                            onChange={() => {
                                setSelectedFieldType(type.id);

                                setTimeout(() => {
                                    handleFilterSubmit(type.id);
                                }, 100);
                            }}
                        >
                            {type.name}
                        </Tag.CheckableTag>
                    ))}
                </div>

            </section>

            <section className="fields-section">
                <Row gutter={[24, 24]}>
                    {fields.map((field: any) => (
                        <Col
                            xs={24}
                            sm={12}
                            lg={8}
                            key={`${field.tenant_id}_${field.field_type?.id}`}
                        >
                            <Card
                                hoverable
                                className="field-card"
                            >
                                {/* <div className="field-banner">
                                    <CompassOutlined />
                                </div> */}

                                <h3>
                                    {field.field_type?.name}
                                </h3>

                                <p className="tenant-name">
                                    {field.tenant?.name}
                                </p>

                                <div className="address">
                                    <EnvironmentOutlined />
                                    <span>
                                        {field.location ||
                                            "Chưa cập nhật địa chỉ"}
                                    </span>
                                </div>

                                {field.distance !== null && (
                                    <Tag color="green">
                                        {field.distance} km
                                    </Tag>
                                )}

                                <div className="card-actions">
                                    {(field.latitude &&
                                        field.longitude) && (
                                            <Button
                                                type="link"
                                                icon={<GlobalOutlined />}
                                                onClick={() =>
                                                    showOnMap(field)
                                                }
                                            >
                                                Xem bản đồ
                                            </Button>
                                        )}

                                    <Link
                                        href={`/${field.tenant?.slug}`}
                                    >
                                        <Button
                                            type="primary"
                                            block
                                        >
                                            Xem page
                                        </Button>
                                    </Link>

                                    <Link
                                        href={`/san/tenant/${field.tenant?.id}/booking?field_type_id=${field.field_type?.id}`}
                                    >
                                        <Button
                                            type="primary"
                                            block
                                        >
                                            Xem lịch & đặt sân
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </section>

            <Drawer
                title={
                    <div className="drawer-title">
                        <span>Bộ lọc tìm kiếm</span>

                        <ReloadOutlined
                            className="reset-filter"
                            onClick={() => {
                                setSelectedFieldType(null);
                                setIsNearMeActive(false);
                            }}
                        />
                    </div>
                }
                placement="right"
                open={showFilters}
                onClose={() => setShowFilters(false)}
                width={400}
            >
                <div className="drawer-content">

                    <div className="filter-group">
                        <h4>Loại sân thể thao</h4>

                        <div className="drawer-tags">
                            <Tag.CheckableTag
                                checked={selectedFieldType === null}
                                onChange={() => setSelectedFieldType(null)}
                            >
                                Tất cả
                            </Tag.CheckableTag>

                            {fieldTypes.map((type: any) => (
                                <Tag.CheckableTag
                                    key={type.id}
                                    checked={selectedFieldType === type.id}
                                    onChange={() =>
                                        setSelectedFieldType(type.id)
                                    }
                                >
                                    {type.name}
                                </Tag.CheckableTag>
                            ))}
                        </div>
                    </div>

                    <Divider />

                    <div className="near-me-filter">
                        <div>
                            <h4>Ưu tiên sân gần tôi</h4>
                            <p>Tìm các sân gần vị trí hiện tại của bạn</p>
                        </div>

                        <Switch
                            checked={isNearMeActive}
                            onChange={handleNearMeToggle}
                            loading={loadingLocation}
                        />
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        block
                        className="apply-filter-btn"
                        onClick={() => {
                            handleFilterSubmit();
                            setShowFilters(false);
                        }}
                    >
                        Áp dụng
                    </Button>
                </div>
            </Drawer>

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