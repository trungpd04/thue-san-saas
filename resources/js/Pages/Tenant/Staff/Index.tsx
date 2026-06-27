import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, Button, Card, Space, Modal, Form, Input, Switch, Tag, Popconfirm, message, Progress, Tooltip, Row, Col, Typography, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, UserOutlined, PhoneOutlined, MailOutlined, KeyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import TenantLayout from '../../../Layout/Tenant/TenantLayout';

const { Text, Title, Paragraph } = Typography;

interface StaffMember {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string | { value: string; name: string };
    is_active: boolean;
    permissions: string[] | null;
    deleted_at: string | null;
}

interface PageProps {
    [key: string]: any;
    staffMembers: StaffMember[];
    maxStaff: number;
    currentStaffCount: number;
    planName: string;
    flash: {
        success?: string;
    };
    errors: Record<string, string> & { error?: string };
}

const PERMISSIONS_LIST = [
    { label: 'Tổng quan (Dashboard)', value: 'access_dashboard', desc: 'Xem trang tổng quan, thống kê doanh thu và hoạt động.', required: true },
    { label: 'Quản lý sân (Fields)', value: 'manage_fields', desc: 'Thêm mới, chỉnh sửa thông tin sân, ngừng hoạt động sân.' },
    { label: 'Cấu hình giá (Field Prices)', value: 'manage_field_prices', desc: 'Thiết lập biểu giá cho từng loại sân, khung giờ.' },
    { label: 'Quản lý đặt sân (Bookings)', value: 'manage_bookings', desc: 'Đặt lịch, xem sơ đồ sân, quản lý trạng thái đặt sân, lịch sử.', required: true },
];

const PERMISSION_TAG_COLORS: Record<string, string> = {
    access_dashboard: 'blue',
    manage_fields: 'green',
    manage_field_prices: 'orange',
    manage_bookings: 'purple',
};

const PERMISSION_LABELS: Record<string, string> = {
    access_dashboard: 'Tổng quan',
    manage_fields: 'Quản lý sân',
    manage_field_prices: 'Cấu hình giá',
    manage_bookings: 'Đặt sân',
};

export default function StaffIndex() {
    const { staffMembers, maxStaff, currentStaffCount, planName, flash, errors } = usePage<PageProps>().props;
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [processing, setProcessing] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Permission Modal States
    const [isPermModalVisible, setIsPermModalVisible] = useState(false);
    const [permStaff, setPermStaff] = useState<StaffMember | null>(null);
    const [permForm] = Form.useForm();

    const tenantSlug = window.location.pathname.split('/')[2];
    const limitReached = currentStaffCount >= maxStaff;

    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (errors?.error) {
            message.error(errors.error);
        }
    }, [flash, errors]);

    const showAddModal = () => {
        if (limitReached) {
            message.warning('Bạn đã đạt giới hạn nhân viên của gói cước hiện tại.');
            return;
        }
        setEditingStaff(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setIsModalVisible(true);
    };

    const showEditModal = (record: StaffMember) => {
        setEditingStaff(record);
        
        // Safe resolution of role string
        const roleStr = typeof record.role === 'object' && record.role !== null
            ? record.role.value
            : record.role;

        form.setFieldsValue({
            name: record.name,
            email: record.email,
            phone: record.phone,
            is_active: Boolean(record.is_active),
            role: roleStr,
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingStaff(null);
    };

    const showPermModal = (record: StaffMember) => {
        setPermStaff(record);
        
        const perms = record.permissions || [];
        const switchesValue: Record<string, boolean> = {};
        PERMISSIONS_LIST.forEach(p => {
            switchesValue[p.value] = p.required ? true : perms.includes(p.value);
        });

        permForm.setFieldsValue({
            permissions_switches: switchesValue,
        });
        setIsPermModalVisible(true);
    };

    const handlePermCancel = () => {
        setIsPermModalVisible(false);
        permForm.resetFields();
        setPermStaff(null);
    };

    const onPermFinish = (values: any) => {
        if (!permStaff) return;
        setProcessing(true);
        const switches = values.permissions_switches || {};
        
        // Ensure default required permissions are always included
        const defaultPerms = PERMISSIONS_LIST.filter(p => p.required).map(p => p.value);
        const selectedPerms = Object.keys(switches).filter(k => switches[k] === true);
        const permissions = Array.from(new Set([...defaultPerms, ...selectedPerms]));

        router.put(`/tenant/${tenantSlug}/staff/${permStaff.id}`, { permissions }, {
            onSuccess: () => {
                setIsPermModalVisible(false);
                setProcessing(false);
                message.success('Cập nhật phân quyền nhân viên thành công!');
            },
            onError: () => setProcessing(false),
        });
    };

    const onFinish = (values: any) => {
        setProcessing(true);
        const submitData = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            is_active: values.is_active ? 1 : 0,
            password: values.password,
        };

        if (editingStaff) {
            router.put(`/tenant/${tenantSlug}/staff/${editingStaff.id}`, submitData, {
                onSuccess: () => {
                    setIsModalVisible(false);
                    setProcessing(false);
                    message.success('Cập nhật nhân viên thành công!');
                },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/tenant/${tenantSlug}/staff`, submitData, {
                onSuccess: () => {
                    setIsModalVisible(false);
                    setProcessing(false);
                    message.success('Thêm nhân viên mới thành công!');
                },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/tenant/${tenantSlug}/staff/${id}`, {
            onBefore: () => setDeletingId(id),
            onSuccess: () => message.success('Xóa nhân viên thành công!'),
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            title: 'Tên nhân viên',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: StaffMember) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.deleted_at ? '#d9d9d9' : (record.is_active ? '#7cb305' : '#faad14') }} />
                    <span style={{ fontWeight: 'bold', color: record.deleted_at ? '#bfbfbf' : 'inherit' }}>
                        {text}
                    </span>
                </Space>
            )
        },
        {
            title: 'Thông tin liên hệ',
            key: 'contact',
            render: (_: any, record: StaffMember) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: record.deleted_at ? '#bfbfbf' : 'inherit' }}>
                    <span><MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />{record.email}</span>
                    {record.phone && <span><PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />{record.phone}</span>}
                </div>
            )
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: any, record: StaffMember) => {
                const roleStr = typeof role === 'object' && role !== null ? role.value : role;
                const isManager = roleStr === 'manager';
                return (
                    <Tag color={record.deleted_at ? 'default' : (isManager ? 'gold' : 'blue')} style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                        {isManager ? 'Chủ sân' : 'Nhân viên'}
                    </Tag>
                );
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: any, record: StaffMember) => {
                if (record.deleted_at) {
                    return <Tag color="error">Đã ngừng việc</Tag>;
                }
                return (
                    <Tag color={record.is_active ? 'success' : 'warning'}>
                        {record.is_active ? 'Hoạt động' : 'Tạm khóa'}
                    </Tag>
                );
            }
        },
        {
            title: 'Quyền hạn',
            dataIndex: 'permissions',
            key: 'permissions',
            width: '35%',
            render: (permissions: string[] | null, record: StaffMember) => {
                const roleStr = typeof record.role === 'object' && record.role !== null ? record.role.value : record.role;
                if (roleStr === 'manager') {
                    return <Tag color="gold"><SafetyCertificateOutlined /> Toàn quyền hệ thống</Tag>;
                }
                if (!permissions || permissions.length === 0) {
                    return <span style={{ fontStyle: 'italic', color: '#bfbfbf' }}>Không có quyền nào</span>;
                }
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {permissions.map(perm => (
                            <Tag color={record.deleted_at ? 'default' : (PERMISSION_TAG_COLORS[perm] || 'default')} key={perm}>
                                {PERMISSION_LABELS[perm] || perm}
                            </Tag>
                        ))}
                    </div>
                );
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: StaffMember) => {
                const roleStr = typeof record.role === 'object' && record.role !== null ? record.role.value : record.role;
                const isManager = roleStr === 'manager';

                return (
                    <Space size="middle">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => showEditModal(record)}
                            title={record.deleted_at ? "Khôi phục / Chỉnh sửa" : "Sửa nhân viên"}
                        />
                        {!isManager && !record.deleted_at && (
                            <>
                                <Button
                                    type="text"
                                    icon={<SafetyCertificateOutlined style={{ color: '#7cb305' }} />}
                                    onClick={() => showPermModal(record)}
                                    title="Phân quyền nhân viên"
                                />
                                <Popconfirm
                                    title="Xác nhận xóa nhân viên?"
                                    description="Tài khoản này sẽ ngừng hoạt động nhưng vẫn tính vào giới hạn nhân viên của gói cước."
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        title="Xóa nhân viên"
                                    />
                                </Popconfirm>
                            </>
                        )}
                    </Space>
                );
            }
        }
    ];

    // Safe resolution of role string for editing staff
    const editingRoleStr = editingStaff
        ? (typeof editingStaff.role === 'object' && editingStaff.role !== null ? editingStaff.role.value : editingStaff.role)
        : '';
    const isEditingManager = editingRoleStr === 'manager';

    return (
        <div style={{ padding: '4px' }}>
            <Head title="Quản lý nhân viên" />

            {/* Quota limit card with Premium glassmorphism border & shadow styling */}
            <Card 
                style={{ 
                    marginBottom: 24, 
                    borderRadius: 12, 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    background: 'linear-gradient(135deg, #f9fbf7 0%, #f4f8ee 100%)',
                    border: '1px solid #e2ebb4'
                }}
            >
                <Row align="middle" gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size={4}>
                            <Title level={4} style={{ margin: 0, color: '#3f5b00' }}>
                                Giới hạn nhân viên: {currentStaffCount} / {maxStaff}
                            </Title>
                        </Space>
                    </Col>
                    <Col xs={24} md={8}>
                        <Progress 
                            percent={Math.min(100, Math.round((currentStaffCount / maxStaff) * 100))} 
                            status={limitReached ? "exception" : "normal"}
                            strokeColor={limitReached ? '#ff4d4f' : '#7cb305'}
                            format={() => `${currentStaffCount} / ${maxStaff}`}
                        />
                    </Col>
                </Row>
            </Card>

            <Card
                title={
                    <Space>
                        <UserOutlined style={{ color: '#7cb305' }} />
                        <span>Danh sách tài khoản nhân viên</span>
                    </Space>
                }
                extra={
                    limitReached ? (
                        <Tooltip title="Đã đạt giới hạn số lượng nhân viên của gói cước. Vui lòng nâng cấp gói cước để tạo thêm.">
                            <Button type="primary" icon={<PlusOutlined />} disabled>
                                Thêm nhân viên mới
                            </Button>
                        </Tooltip>
                    ) : (
                        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal} style={{ backgroundColor: '#7cb305', borderColor: '#7cb305' }}>
                            Thêm nhân viên mới
                        </Button>
                    )
                }
                style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}
            >
                <Table
                    columns={columns}
                    dataSource={staffMembers}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingStaff ? "Cập nhật thông tin nhân viên" : "Thêm nhân viên mới"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
                width={650}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={onFinish} 
                    initialValues={{ 
                        is_active: true, 
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên nhân viên" rules={[{ required: true, message: 'Vui lòng nhập tên nhân viên' }]}>
                                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="VD: Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="VD: 0987654321" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                name="email" 
                                label="Địa chỉ Email" 
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email' },
                                    { type: 'email', message: 'Địa chỉ email không hợp lệ' }
                                ]}
                            >
                                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="VD: nv.a@gmail.com" disabled={!!editingStaff} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                name="password" 
                                label="Mật khẩu" 
                                rules={editingStaff ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}
                                help={editingStaff ? "Để trống nếu không muốn thay đổi mật khẩu" : ""}
                            >
                                <Input.Password prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />} placeholder="Tối thiểu 6 ký tự" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="checked">
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm khóa" style={{ backgroundColor: form.getFieldValue('is_active') ? '#52c41a' : '#bfbfbf' }} />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processing} style={{ backgroundColor: '#7cb305', borderColor: '#7cb305' }}>
                                Lưu thông tin
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Phân quyền riêng biệt */}
            <Modal
                title={`Phân quyền tính năng nhân viên: ${permStaff?.name || ''}`}
                open={isPermModalVisible}
                onCancel={handlePermCancel}
                footer={null}
                destroyOnClose
                width={580}
            >
                <Form form={permForm} layout="vertical" onFinish={onPermFinish}>
                    <Form.Item label="Thiết lập các quyền hạn truy cập" style={{ marginBottom: 0 }}>
                        <Row gutter={[12, 12]}>
                            {PERMISSIONS_LIST.map((permission) => (
                                <Col span={24} key={permission.value}>
                                    <Card size="small" style={{ borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1, paddingRight: 12 }}>
                                                <Space align="center" style={{ marginBottom: 4 }}>
                                                    <Text strong style={{ color: '#3f5b00' }}>{permission.label}</Text>
                                                    {permission.required && (
                                                        <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                                                            Mặc định
                                                        </Tag>
                                                    )}
                                                </Space>
                                                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{permission.desc}</div>
                                            </div>
                                            <Form.Item 
                                                name={['permissions_switches', permission.value]} 
                                                valuePropName="checked" 
                                                noStyle
                                            >
                                                <Switch 
                                                    checkedChildren="Có"
                                                    unCheckedChildren="Không"
                                                    disabled={permission.required}
                                                />
                                            </Form.Item>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={handlePermCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processing} style={{ backgroundColor: '#7cb305', borderColor: '#7cb305' }}>
                                Lưu phân quyền
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

StaffIndex.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
