import React, { useState } from 'react';
import {
    Layout,
    Typography,
    Button,
    Row,
    Col,
    Rate,
    Empty
} from 'antd';

import {
    EnvironmentOutlined,
    PhoneOutlined,
    ClockCircleOutlined,
    HomeOutlined,
    BellOutlined,
    UserOutlined
} from '@ant-design/icons';

import '../../../css/PublicLanding.css';

const { Title, Text } = Typography;

export default function PublicLanding({ tenant, fields }: any) {

    const [activeTab, setActiveTab] = useState('info');

    return (
        <Layout className="stadium-layout">

            {/* COVER */}
            <div
                className="stadium-cover"
                style={{
                    backgroundImage:
                        `url("/images/sports-background-dark-green-style.jpg")`
                }}
            >
                <div className="cover-overlay"></div>
            </div>

            {/* HEADER */}
            <div className="stadium-header">

                <div className="stadium-profile-wrapper">

                    {/* LOGO */}
                    <div className="stadium-logo">
                        <img
                            src="/images/sport2.jpg"
                            alt="logo"
                        />
                    </div>

                    {/* INFO */}
                    <div className="stadium-info">

                        <Title level={2} className="stadium-name">
                            {tenant?.name}
                        </Title>

                        <Rate
                            disabled
                            defaultValue={5}
                            className="stadium-rate"
                        />

                    </div>

                </div>

                {/* BUTTON */}
                <Button
                    className="booking-btn"
                    href={`/san/tenant/${tenant.id}/booking`}
                >
                    Đặt lịch
                </Button>

            </div>

            {/* TABS */}
            <div className="custom-tabs">

                <div
                    className={`tab-item ${activeTab === 'info' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    Thông tin & Hình ảnh
                </div>

                <div
                    className={`tab-item ${activeTab === 'service' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('service')}
                >
                    Dịch vụ & Đánh giá
                </div>

                <div
                    className={`tab-item ${activeTab === 'rules' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('rules')}
                >
                    Điều khoản & quy định
                </div>

            </div>

            {/* CONTENT */}
            <div className="stadium-content">

                {/* INFO */}
                {activeTab === 'info' && (

                    <Row gutter={[32, 32]}>

                        <Col xs={24} md={12}>

                            <div className="info-item">
                                <EnvironmentOutlined />
                                <Text>
                                    {tenant?.address || 'Chưa cập nhật địa chỉ'}
                                </Text>
                            </div>

                            <div className="info-item">
                                <ClockCircleOutlined />
                                <Text>
                                    Giờ hoạt động: 07:00 - 22:00
                                </Text>
                            </div>

                            <div className="info-item">
                                <PhoneOutlined />
                                <Text>
                                    {tenant?.phone || 'Liên hệ'}
                                </Text>
                            </div>

                            <div className="info-item">
                                <PhoneOutlined />
                                <Text>
                                    Hotline hỗ trợ đặt sân
                                </Text>
                            </div>

                        </Col>

                        <Col xs={24} md={12}>

                            <div className="empty-image-box">
                                Chưa có hình ảnh nào!
                            </div>

                        </Col>

                    </Row>

                )}

                {/* SERVICE */}
                {activeTab === 'service' && (

                    <div className="service-wrapper">

                        {/* LEFT */}
                        <div className="price-section">

                            <Title level={4} className="price-title">
                                BẢNG GIÁ SÂN
                            </Title>

                            {fields && fields.length > 0 ? (
                                fields.map((field: any) => {

                                    const prices = field.field_prices || [];

                                    return (
                                        <div
                                            key={field.id}
                                            className="price-table-wrapper"
                                        >

                                            <div className="table-header">
                                                {field.name}
                                            </div>

                                            <table className="price-table">

                                                <thead>
                                                    <tr>
                                                        <th>Thứ</th>
                                                        <th>Khung giờ</th>
                                                        <th>Giá</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {prices.length > 0 ? (
                                                        prices.map((price: any, index: number) => {

                                                            const dayText =
                                                                price.day_type === 'weekday'
                                                                    ? 'T2 - T6'
                                                                    : price.day_type === 'weekend'
                                                                        ? 'T7 - CN'
                                                                        : 'Mặc định';

                                                            return (
                                                                <tr key={index}>

                                                                    <td>
                                                                        {dayText}
                                                                    </td>

                                                                    <td>
                                                                        {price.start_time?.slice(0, 5)}
                                                                        {' - '}
                                                                        {price.end_time?.slice(0, 5)}
                                                                    </td>

                                                                    <td>
                                                                        {Number(price.price_per_hour).toLocaleString()} đ
                                                                    </td>

                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3}>
                                                                Chưa có bảng giá
                                                            </td>
                                                        </tr>
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>
                                    );
                                })
                            ) : (
                                <Empty description="Chưa có sân nào" />
                            )}

                        </div>

                        {/* RIGHT */}
                        <div className="review-section">

                            <div className="review-empty">
                                Hiện tại chưa có lượt đánh giá nào.
                            </div>

                        </div>

                    </div>

                )}

                {/* RULES */}
                {activeTab === 'rules' && (

                    <div className="rules-box">

                        <Text>
                            Sân này chưa cập nhật điều khoản.
                        </Text>

                    </div>

                )}

            </div>


        </Layout>
    );
}