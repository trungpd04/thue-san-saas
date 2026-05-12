import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TenantLayout from '../../../Layout/Tenant/TenantLayout'; 

interface FieldType {
    id: number;
    name: string;
    sport: string;
}

interface Field {
    id: number;
    name: string;
    field_type_id: number;
    location: string;
    description: string;
    is_active: boolean;
    deleted_at: string | null; 
    field_type?: FieldType;
}

interface PageProps {
    [key: string]: any;
    fields: Field[];
    fieldTypes: FieldType[];
    flash: {
        success?: string;
        booking_warning?: string; 
    };
    errors: Record<string, string> & { error?: string }; 
    auth?: {
        user?: {
            id: number;
            name: string;
            role: any; 
        }
    };
}

export default function FieldIndex() {
    const { fields, fieldTypes, flash, errors, auth } = usePage<PageProps>().props;
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [processing, setProcessing] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const tenantSlug = window.location.pathname.split('/')[2];
    
    // Kiểm tra quyền manager
    const userRole = auth?.user?.role?.value || auth?.user?.role;
    const isOwner = userRole === 'manager';

    useEffect(() => {
        // 1. Hiển thị thông báo thành công (Thêm/Sửa/Xóa thành công)
        if (flash?.success) {
            message.success(flash.success);
        }

        // 2. Hiển thị thông báo lỗi (Vượt quota, Sân đang có lịch đặt, v.v.)
        // Backend sẽ trả lỗi về biến errors.error khi không cho phép xóa
        if (errors?.error) {
            message.error(errors.error);
        }

    }, [flash, errors]);

    const showAddModal = () => {
        setEditingField(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setIsModalVisible(true);
    };

    const showEditModal = (record: Field) => {
        setEditingField(record);
        // Khi mở modal sửa, is_active sẽ dựa trên giá trị thực tế của record
        form.setFieldsValue({
            ...record,
            is_active: Boolean(record.is_active),
        });
        setIsModalVisible(true);
    };

 const handleCancel = () => {
        setIsModalVisible(false); // Đóng hộp thoại Modal
        form.resetFields();       // Dọn sạch dữ liệu hiển thị trên Form (Ant Design)
        setEditingField(null);    // Dọn sạch State lưu trữ dữ liệu đang sửa (React)
    };

    const onFinish = (values: any) => {
        setProcessing(true);
        const submitData = { ...values, is_active: values.is_active ? 1 : 0 };

        if (editingField) {
            // Gửi request PUT để cập nhật/khôi phục
            router.put(`/tenant/${tenantSlug}/fields/${editingField.id}`, submitData, {
                onSuccess: () => { setIsModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/tenant/${tenantSlug}/fields`, submitData, {
                onSuccess: () => { setIsModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        }
    };

  const handleDelete = (id: number) => {
        router.delete(`/tenant/${tenantSlug}/fields/${id}`, {
            onBefore: () => setDeletingId(id),
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        { 
            title: 'Tên Sân', 
            dataIndex: 'name', 
            key: 'name',
            render: (text: string, record: Field) => (
                <span style={{ fontWeight: 'bold', color: record.deleted_at ? '#bfbfbf' : 'inherit' }}>
                    {text}
                </span>
            )
        },
        {
            title: 'Loại Sân', 
            key: 'field_type',
            render: (_: any, record: Field) => (
                <Tag color={record.deleted_at ? 'default' : 'blue'}>
                    {record.field_type?.name || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Địa chỉ / Khu vực',
            dataIndex: 'location',
            key: 'location',
            render: (text: string, record: Field) => (
                // Làm mờ chữ nếu sân đã ngừng hoạt động để đồng bộ giao diện
                <span style={{ color: record.deleted_at ? '#bfbfbf' : 'inherit' }}>
                    {text || <span style={{ fontStyle: 'italic', color: '#d9d9d9' }}>Chưa cập nhật</span>}
                </span>
            ),
        },
       { 
            title: 'Trạng thái', 
            key: 'status',
            render: (_: any, record: Field) => {
                // Trường hợp 1: Nếu bị xóa (có deleted_at) -> Ngừng hoạt động (Màu đỏ)
                if (record.deleted_at) {
                    return <Tag color="error">Ngừng hoạt động</Tag>;
                }
                
                // Trường hợp 2: Nếu chưa bị xóa nhưng TẮT công tắc -> Đang bảo trì (Màu cam)
                if (!record.is_active) {
                    return <Tag color="warning">Đang bảo trì</Tag>;
                }
                
                // Trường hợp 3: Chưa xóa và BẬT công tắc -> Đang hoạt động (Màu xanh)
                return <Tag color="success">Đang hoạt động</Tag>;
            },
        },
     {
            title: 'Hành động', 
            key: 'action',
            render: (_: any, record: Field) => (
                <Space size="middle">
                    {isOwner ? (
                        <>
                            {/* Nút Sửa: Luôn hiển thị để cho phép chỉnh sửa hoặc khôi phục sân */}
                            <Button 
                                type="text" 
                                icon={<EditOutlined />} 
                                title={record.deleted_at ? "Khôi phục sân" : "Sửa thông tin"}
                                onClick={() => showEditModal(record)} 
                            />
                            
                            {/* Nút Xóa: Chỉ hiển thị khi sân đang hoạt động/bảo trì */}
                            {!record.deleted_at && (
                                <Popconfirm
                                    title="Xác nhận ngừng hoạt động sân?"
                                    description="Sân này sẽ không thể nhận lịch đặt mới cho đến khi được khôi phục."
                                    onConfirm={() => handleDelete(record.id)} // Chỉ chạy hàm xóa khi bấm "Đồng ý"
                                    okText="Đồng ý" 
                                    cancelText="Hủy" 
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        title="Ngừng hoạt động"
                                    />
                                </Popconfirm>
                            )}
                        </>
                    ) : (
                        <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Nhân viên</span>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Head title="Quản lý Sân" />
            <Card 
                title="Danh sách Sân" 
                extra={isOwner ? <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Thêm sân mới</Button> : null}
                variant="borderless"
            >
                <Table 
                    columns={columns} 
                    dataSource={fields} 
                    rowKey="id" 
                    pagination={{ pageSize: 10 }}
                    rowClassName={(record) => record.deleted_at ? 'row-deleted' : ''}
                />
            </Card>

            <Modal 
                title={editingField ? "Sửa thông tin sân" : "Thêm sân mới"} 
                open={isModalVisible} 
                onCancel={handleCancel} 
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Tên sân" rules={[{ required: true, message: 'Vui lòng nhập tên sân' }]}>
                        <Input placeholder="VD: Sân bóng số 1" />
                    </Form.Item>
                    
                    <Form.Item name="field_type_id" label="Loại sân" rules={[{ required: true, message: 'Vui lòng chọn loại sân' }]}>
                        <Select placeholder="Chọn loại sân">
                            {fieldTypes.map(type => (
                                <Select.Option key={type.id} value={type.id}>{type.name} ({type.sport})</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="location" label="Khu vực/Vị trí">
                        <Input placeholder="VD: Khu A, Tầng 1..." />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả thêm về sân (nếu có)" />
                    </Form.Item>

                    <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="checked">
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processing}>
                                Lưu thông tin
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
            
            <style>{`
                .row-deleted {
                    background-color: #fafafa;
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
}

FieldIndex.layout = (page: React.ReactNode) => <TenantLayout children={page} />;