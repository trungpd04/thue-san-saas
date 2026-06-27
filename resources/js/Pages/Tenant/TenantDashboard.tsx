import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, Col, Row, Statistic, Typography, Select, Button, Modal, Form } from 'antd';
import { AppstoreOutlined, CalendarOutlined, CrownOutlined, DollarCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Bar } from 'recharts';
import TenantLayout from '../../Layout/Tenant/TenantLayout'; 

const { Title } = Typography;

export default function TenantDashboard({ stats = {}, chartDataCurrentYear = [], chartDataLastYear = [] }: any) {
    // Mặc định cho hiển thị Năm hiện tại
    const [chartFilter, setChartFilter] = useState('current_year');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    };

    // Lấy dữ liệu 12 tháng tương ứng với năm được chọn
    const currentChartData = chartFilter === 'current_year' ? chartDataCurrentYear : chartDataLastYear;

    const { props } = usePage<any>();
    const tenancy = props.tenancy;
    const slug = tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';

    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [exportForm] = Form.useForm();

    const handleExport = (values: any) => {
        const { export_year, export_month } = values;
        let url = `${base}/dashboard/export?year=${export_year}`;
        if (export_month && export_month !== 'all') {
            url += `&month=${export_month}`;
        }
        window.location.href = url;
        setIsExportModalVisible(false);
    };

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100%' }}>
            <Head title="Tổng quan" />
            <Title level={2} style={{ marginBottom: '24px' }}>Tổng quan hệ thống</Title>

            {/* Thẻ thống kê */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Tổng số sân" value={stats.total_fields} prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />} styles={{ content: { fontWeight: 'bold' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Lịch đặt tháng này" value={stats.total_bookings} prefix={<CalendarOutlined style={{ color: '#722ed1' }} />} styles={{ content: { fontWeight: 'bold', color: '#722ed1' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Doanh thu tháng này" value={stats.revenue} formatter={(v) => formatCurrency(Number(v))} prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />} styles={{ content: { fontWeight: 'bold', color: '#52c41a' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Gói cước hiện tại" value={stats.current_plan} prefix={<CrownOutlined style={{ color: '#faad14' }} />} styles={{ content: { fontWeight: 'bold', color: '#faad14' } }} />
                    </Card>
                </Col>
            </Row>

            {/* Biểu đồ */}
            <Card 
                variant="borderless"
                style={{ borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                title={<Title level={4} style={{ margin: 0 }}>Thống kê doanh thu & lịch đặt</Title>}
                extra={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={() => {
                            exportForm.setFieldsValue({ 
                                export_year: chartFilter === 'current_year' ? stats.current_year : stats.last_year,
                                export_month: 'all'
                            });
                            setIsExportModalVisible(true);
                        }}>
                            Xuất Excel
                        </Button>
                        <Select
                            value={chartFilter}
                            style={{ width: 140 }}
                            onChange={(value) => setChartFilter(value)}
                            options={[
                                { value: 'current_year', label: `Năm ${stats.current_year}` },
                                { value: 'last_year', label: `Năm ${stats.last_year}` },
                            ]}
                        />
                    </div>
                }
            >
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer width="100%" height={400}>
                       <ComposedChart data={currentChartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            
                            <XAxis 
                                dataKey="name" 
                                height={30}
                                tick={{ fontSize: 12 }} 
                            />
                            
                            {/* FIX 1: Xử lý trục Y, nếu là 0 thì hiện '0', nếu khác 0 thì làm tròn 1 chữ số thập phân */}
                            <YAxis 
                                yAxisId="left" 
                                tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000000).toFixed(1)}M`} 
                                width={80} // Cố định độ rộng để chữ không bị sát lề
                            />
                            
                            {/* Ép trục Y bên phải chỉ hiện số nguyên (allowDecimals={false}) */}
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                allowDecimals={false} 
                            />
                            
                            {/* FIX 2: So sánh đúng tên hiển thị của Bar và Line */}
                            <Tooltip 
                                formatter={(value: number, name: string) => {
                                    if (name === 'Doanh thu') return [formatCurrency(value), 'Doanh thu'];
                                    return [value, 'Số lịch đặt'];
                                }} 
                            />
                            
                            <Legend verticalAlign="top" height={36}/>
                            
                            <Bar yAxisId="left" dataKey="doanh_thu" name="Doanh thu" fill="#1890ff" radius={[4, 4, 0, 0]} barSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="lich_dat" name="Số lịch đặt" stroke="#faad14" strokeWidth={3} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Modal
                title="Xuất Báo Cáo Doanh Thu"
                open={isExportModalVisible}
                onCancel={() => setIsExportModalVisible(false)}
                onOk={() => exportForm.submit()}
                okText="Tải xuống Excel"
                cancelText="Hủy"
            >
                <Form form={exportForm} layout="vertical" onFinish={handleExport}>
                    <Form.Item label="Chọn năm" name="export_year" initialValue={stats.current_year}>
                        <Select
                            options={[
                                { value: stats.current_year, label: `Năm ${stats.current_year}` },
                                { value: stats.last_year, label: `Năm ${stats.last_year}` },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Chọn thời gian" name="export_month" initialValue="all">
                        <Select
                            options={[
                                { value: 'all', label: 'Cả năm (Thống kê theo tháng)' },
                                ...Array.from({ length: 12 }, (_, i) => ({
                                    value: i + 1,
                                    label: `Tháng ${i + 1} (Thống kê theo ngày)`
                                }))
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

TenantDashboard.layout = (page: React.ReactNode) => <TenantLayout children={page} />;