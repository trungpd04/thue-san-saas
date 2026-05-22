import React, { useState } from 'react';
import { Layout, Button, Typography, Row, Col, Card, Space, Tag, Modal, Form, Input, message } from 'antd';
import { 
    CheckCircleFilled, ArrowRightOutlined, UserOutlined, MailOutlined, 
    LockOutlined, PhoneOutlined, HomeOutlined, ShopOutlined,
    CalendarOutlined, ThunderboltOutlined, BarChartOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { Head, useForm } from '@inertiajs/react';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

interface PlanItem {
    id: number;
    name: string;
    price: number;
    max_fields: number;
    max_staff: number;
    features: string[];
}

interface LandingProps {
    plans: PlanItem[];
}

export default function Landing({ plans }: LandingProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

    // Inertia Form xử lý dữ liệu đăng ký thuê gói SaaS
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        company_name: '',
        name: '',
        company_phone: '',
        company_address: '',
        email: '',
        password: '',
        password_confirmation: '',
        plan_id: '',
    });

    const formatCurrency = (value: number) => {
        return value === 0 ? "Miễn phí" : new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    };

    const handleOpenRegisterModal = (plan: PlanItem) => {
        setSelectedPlan(plan);
        setData(prev => ({ ...prev, plan_id: String(plan.id) }));
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlan(null);
        clearErrors();
        reset();
    };

    const handleSubmitRegister = () => {
        post('/register-tenant', {
            // Chạy ngay sau khi Backend lưu DB thành công và trả về redirect()->back()
            onSuccess: () => {
                // 1. Ẩn modal form cấu hình trên màn hình
                setIsModalOpen(false);
                
                // 2. Xóa sạch dữ liệu cũ trong form ô nhập liệu
                reset();
                
                // 3. Đưa gói cước đang lựa chọn về trạng thái null ban đầu
                setSelectedPlan(null);
                
                // 4. Báo thông báo xanh bằng Ant Design mượt mà
                message.success('Khởi tạo không gian hệ thống chuỗi sân bãi thành công!');
            },
            // Chạy nếu Validate ở tầng Backend (Controller) trả về lỗi định dạng dữ liệu
            onError: (backendErrors) => {
                console.log("Lỗi đăng ký từ hệ thống:", backendErrors);
                message.error('Khởi tạo thất bại. Vui lòng rà soát lại các trường thông tin đỏ!');
            }
        });
    };

    return (
        <>
            <Head title="PITCH-SAAS - Nền tảng quản lý và vận hành sân thể thao thông minh" />

            <Layout style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: 'Inter, sans-serif' }}>
                
                {/* 1. NAVBAR CHUYÊN NGHIỆP CÔNG CỘNG */}
                <Header style={{ 
                    position: 'sticky', top: 0, zIndex: 100, width: '100%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'between',
                    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid #f0f0f0', padding: '0 80px', height: '70px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ fontWeight: '800', fontSize: '22px', color: '#52c41a', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '26px' }}>⚽</span> PITCH-SAAS
                        </div>
                        
                        <Space size="large">
                            <a href="#features" style={{ color: '#555', fontWeight: 500 }}>Tính năng</a>
                            <a href="#pricing" style={{ color: '#555', fontWeight: 500 }}>Bảng giá</a>
                            <div style={{ width: '1px', height: '20px', background: '#d9d9d9', margin: '0 10px' }} />
                            
                            <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 600, borderRadius: '6px', boxShadow: '0 2px 8px rgba(82,196,26,0.2)' }} onClick={() => plans.length > 0 && handleOpenRegisterModal(plans[0])}>
                                Đăng ký mở bãi sân
                            </Button>
                        </Space>
                    </div>
                </Header>

                {/* 2. NỘI DUNG TRANG LANDING */}
                <Content style={{ padding: 0 }}>
                    
                    {/* SECTION 1: HERO PREMIUM ACCENT */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)', 
                        padding: '120px 80px 80px', 
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Tag color="green" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
                            🚀 Giải pháp số hóa sân thể thao hàng đầu Việt Nam
                        </Tag>
                        
                        <Title level={1} style={{ fontSize: '48px', fontWeight: 800, color: '#141414', maxWidth: '900px', margin: '0 auto 24px', lineHeight: '1.2' }}>
                            Bứt Phá Doanh Thu Cùng Hệ Thống Quản Lý Sân Thông Minh
                        </Title>
                        
                        <Paragraph style={{ fontSize: '19px', color: '#434343', maxWidth: '750px', margin: '0 auto 40px', lineHeight: '1.6' }}>
                            Tự động hóa toàn bộ quy trình đặt sân trực tuyến, quản lý lịch cố định, tính toán ca lưới linh hoạt và tối ưu hiệu suất vận hành bãi bến cho chủ sân.
                        </Paragraph>
                        
                        <Space size="middle">
                            <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', height: '54px', padding: '0 32px', borderRadius: '8px', fontWeight: 600, fontSize: '16px', boxShadow: '0 4px 14px rgba(82,196,26,0.3)' }} onClick={() => plans.length > 0 && handleOpenRegisterModal(plans[0])}>
                                Thử nghiệm miễn phí ngay
                            </Button>
                            <Button size="large" style={{ height: '54px', padding: '0 28px', borderRadius: '8px', fontWeight: 500 }} href="#pricing">
                                Xem bảng giá dịch vụ
                            </Button>
                        </Space>

                        {/* STATS COUNTER GRID */}
                        <Row gutter={32} justify="center" style={{ marginTop: '80px', maxWidth: '900px', margin: '80px auto 0' }}>
                            <Col span={8}>
                                <Title level={2} style={{ color: '#52c41a', margin: 0, fontWeight: 800 }}>500+</Title>
                                <Text type="secondary" style={{ fontSize: '15px', fontWeight: 500 }}>Sân cỏ toàn quốc tin dùng</Text>
                            </Col>
                            <Col span={8}>
                                <Title level={2} style={{ color: '#52c41a', margin: 0, fontWeight: 800 }}>1.2M+</Title>
                                <Text type="secondary" style={{ fontSize: '15px', fontWeight: 500 }}>Lượt đặt ca thành công</Text>
                            </Col>
                            <Col span={8}>
                                <Title level={2} style={{ color: '#52c41a', margin: 0, fontWeight: 800 }}>99.9%</Title>
                                <Text type="secondary" style={{ fontSize: '15px', fontWeight: 500 }}>Thời gian hệ thống ổn định</Text>
                            </Col>
                        </Row>
                    </div>

                    {/* SECTION 2: TÍNH NĂNG NỔI BẬT (FEATURES GRID) */}
                    <div id="features" style={{ padding: '100px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                            <Title level={2} style={{ fontSize: '32px', fontWeight: 700 }}>Tại sao các chủ sân lựa chọn PITCH-SAAS?</Title>
                            <Text type="secondary" style={{ fontSize: '16px' }}>Đầy đủ bộ công cụ chuyên sâu xóa bỏ hoàn toàn quy trình ghi sổ tay lỗi thời</Text>
                        </div>

                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#e6f7ff', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <CalendarOutlined style={{ fontSize: '22px', color: '#1890ff' }} />
                                    </div>
                                    <Title level={4} style={{ marginBottom: '12px' }}>Xếp Lịch Trực Quan</Title>
                                    <Paragraph type="secondary" style={{ fontSize: '14.5px' }}>Xem trạng thái sân trống, lịch đặt cố định, đặt vãng lai tức thì thông qua màn hình Dashboard lưới thông minh, chống trùng lịch tuyệt đối.</Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#f6ffed', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <ThunderboltOutlined style={{ fontSize: '22px', color: '#52c41a' }} />
                                    </div>
                                    <Title level={4} style={{ marginBottom: '12px' }}>Tự Động Chia Ca</Title>
                                    <Paragraph type="secondary" style={{ fontSize: '14.5px' }}>Tự động phân chia khung giờ vàng, khung giờ thường, tính tiền chính xác theo từng loại sân (sân 5, sân 7, sân 11) và khoảng thời gian đá bồi.</Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ background: '#fff', borderRadius: '12px', height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#fff7e6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <BarChartOutlined style={{ fontSize: '22px', color: '#ffa940' }} />
                                    </div>
                                    <Title level={4} style={{ marginBottom: '12px' }}>Báo Cáo Doanh Thu</Title>
                                    <Paragraph type="secondary" style={{ fontSize: '14.5px' }}>Biểu đồ thống kê dòng tiền chi tiết, báo cáo công nợ khách hàng ruột và hiệu suất khai thác sân bãi theo ngày, tuần, tháng rõ ràng.</Paragraph>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* SECTION 3: BẢNG GIÁ ĐẸP MẮT CHUYÊN NGHIỆP (PRICING GRID) */}
                    <div id="pricing" style={{ padding: '100px 80px', background: '#f4f7f4' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                                <Title level={2} style={{ fontSize: '32px', fontWeight: 700 }}>Bảng giá dịch vụ minh bạch</Title>
                                <Paragraph type="secondary" style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                                    Lựa chọn gói cước phù hợp với quy mô kinh doanh của bạn. Hệ thống tự động kích hoạt lập tức sau khi đăng ký thành công.
                                </Paragraph>
                            </div>

                            <Row gutter={[32, 32]} justify="center" style={{ alignItems: 'stretch' }}>
                                {plans && plans.length > 0 ? (
                                    plans.map((plan) => {
                                        const isFeatured = plan.price > 200000;
                                        return (
                                            <Col xs={24} md={10} lg={8} key={plan.id} style={{ display: 'flex' }}>
                                                <Card 
                                                    hoverable 
                                                    title={
                                                        <div style={{ padding: '8px 0' }}>
                                                            <Title level={4} style={{ margin: 0, color: isFeatured ? '#52c41a' : '#1f1f1f', fontWeight: 700 }}>{plan.name}</Title>
                                                        </div>
                                                    } 
                                                    style={{ 
                                                        width: '100%',
                                                        borderRadius: '16px',
                                                        border: isFeatured ? '2px solid #52c41a' : '1px solid #e8e8e8',
                                                        boxShadow: isFeatured ? '0 10px 30px rgba(82,196,26,0.15)' : '0 4px 12px rgba(0,0,0,0.01)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'between',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    extra={isFeatured ? <Tag color="green" style={{ fontWeight: 600, padding: '2px 8px' }}>PHỔ BIẾN</Tag> : null}
                                                >
                                                    <div style={{ marginBottom: '24px', background: isFeatured ? '#f6ffed' : '#fafafa', padding: '16px', borderRadius: '12px' }}>
                                                        <span style={{ fontSize: '36px', fontWeight: '800', color: '#141414' }}>
                                                            {formatCurrency(plan.price)}
                                                        </span>
                                                        {plan.price > 0 && <span style={{ color: '#8c8c8c', fontSize: '14px' }}> / tháng</span>}
                                                    </div>

                                                    <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '40px', flexGrow: 1 }}>
                                                        {plan.features.map((feature, idx) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                                                                <CheckCircleFilled style={{ color: '#52c41a', marginTop: '4px', fontSize: '15px' }} /> 
                                                                <Text style={{ color: '#434343', fontSize: '14.5px' }}>{feature}</Text>
                                                            </div>
                                                        ))}
                                                    </Space>

                                                    <Button 
                                                        type={isFeatured ? "primary" : "default"} 
                                                        block 
                                                        size="large"
                                                        style={{ 
                                                            borderRadius: '8px',
                                                            height: '46px',
                                                            background: isFeatured ? '#52c41a' : '#fff',
                                                            borderColor: '#52c41a',
                                                            color: isFeatured ? '#fff' : '#52c41a',
                                                            fontWeight: 600,
                                                            marginTop: 'auto'
                                                        }}
                                                        onClick={() => handleOpenRegisterModal(plan)}
                                                    >
                                                        {plan.price === 0 ? "Bắt đầu dùng thử" : "Đăng ký mua gói này"}
                                                    </Button>
                                                </Card>
                                            </Col>
                                        );
                                    })
                                ) : (
                                    <Col span={24} style={{ textAlign: 'center' }}>
                                        <Text type="secondary">Hệ thống đang đồng bộ cấu hình dữ liệu gói cước...</Text>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </div>

                </Content>

                {/* MODAL FORM ĐĂNG KÝ MUA GÓI VÀ TỰ ĐỘNG MỞ SÂN */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                            <Title level={4} style={{ margin: 0 }}>Cấu hình không gian mở bãi sân</Title>
                        </div>
                    }
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={[
                        <Button key="cancel" size="large" onClick={handleCloseModal} style={{ borderRadius: '6px' }}>Hủy bỏ</Button>,
                        <Button key="submit" type="primary" size="large" style={{ background: '#52c41a', borderColor: '#52c41a', borderRadius: '6px', fontWeight: 600 }} loading={processing} onClick={handleSubmitRegister}>
                            Xác nhận & Khởi tạo hệ thống
                        </Button>
                    ]}
                    width={680}
                >
                    <Paragraph type="secondary" style={{ marginBottom: '24px', fontSize: '14px' }}>
                        Bạn đang tiến hành đăng ký gói dịch vụ <Text id="selected-plan-text" strong style={{ color: '#52c41a' }}>{selectedPlan?.name}</Text>. Vui lòng điền thông tin doanh nghiệp và thông tin quản trị viên cấp cao. Hệ thống của nhóm bạn sẽ tiến hành kích hoạt lưu trữ an toàn.
                    </Paragraph>

                    <Form layout="vertical">
                        <Title level={5} style={{ borderLeft: '4px solid #52c41a', paddingLeft: '8px', marginBottom: '16px', fontSize: '15px' }}>THÔNG TIN CHUỖI SÂN BÃI</Title>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Tên chuỗi sân / Tổ chức" required validateStatus={errors.company_name ? 'error' : ''} help={errors.company_name}>
                                    <Input prefix={<ShopOutlined style={{ color: '#bfbfbf' }} />} placeholder="Ví dụ: Sân Bóng Đồng Phát" value={data.company_name} onChange={e => setData('company_name', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Số điện thoại liên hệ" required validateStatus={errors.company_phone ? 'error' : ''} help={errors.company_phone}>
                                    <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="Ví dụ: 0987654321" value={data.company_phone} onChange={e => setData('company_phone', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Địa chỉ cơ sở bãi sân" required validateStatus={errors.company_address ? 'error' : ''} help={errors.company_address}>
                            <Input prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập địa chỉ vị trí bãi sân để hiển thị trên hóa đơn..." value={data.company_address} onChange={e => setData('company_address', e.target.value)} style={{ borderRadius: '6px' }} />
                        </Form.Item>

                        <div style={{ height: '1px', background: '#f0f0f0', margin: '24px 0' }} />
                        <Title level={5} style={{ borderLeft: '4px solid #1890ff', paddingLeft: '8px', marginBottom: '16px', fontSize: '15px' }}>TÀI KHOẢN CHỦ SÂN (ADMINISTRATOR)</Title>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Họ và tên chủ sở hữu" required validateStatus={errors.name ? 'error' : ''} help={errors.name}>
                                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập tên người đứng đầu" value={data.name} onChange={e => setData('name', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Email đăng trị quản trị" required validateStatus={errors.email ? 'error' : ''} help={errors.email}>
                                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="hoang@example.com" value={data.email} onChange={e => setData('email', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Mật khẩu tài khoản" required validateStatus={errors.password ? 'error' : ''} help={errors.password}>
                                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Tối thiểu 8 ký tự" value={data.password} onChange={e => setData('password', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Nhập lại mật khẩu" required validateStatus={errors.password_confirmation ? 'error' : ''} help={errors.password_confirmation}>
                                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Xác nhận mật khẩu" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} style={{ borderRadius: '6px' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>

                {/* 3. FOOTER */}
                <Footer style={{ textAlign: 'center', background: '#141414', color: '#8c8c8c', padding: '40px 50px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '16px' }}>⚽ PITCH-SAAS MANAGEMENT NỀN TẢNG</div>
                        <div style={{ color: '#595959' }}>©2026 Được hoàn thiện bởi Đồ án Tốt Nghiệp Team. All rights reserved.</div>
                    </div>
                </Footer>

            </Layout>
        </>
    );
}