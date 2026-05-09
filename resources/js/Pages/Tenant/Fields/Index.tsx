import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// 1. Import Layout của bạn vào đây
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
    field_type?: FieldType;
}

interface PageProps {
    [key: string]: any;
    fields: Field[];
    fieldTypes: FieldType[];
    flash: {
        success?: string;
    };
    errors: Record<string, string>;
}

export default function FieldIndex() {
    const { fields, fieldTypes, flash, errors } = usePage<PageProps>().props;
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [processing, setProcessing] = useState(false);

    const tenantSlug = window.location.pathname.split('/')[2];

    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
    }, [flash]);

    const showAddModal = () => {
        setEditingField(null);
        form.resetFields();
        form.setFieldsValue({ is_active: true });
        setIsModalVisible(true);
    };

    const showEditModal = (record: Field) => {
        setEditingField(record);
        form.setFieldsValue({
            ...record,
            is_active: Boolean(record.is_active),
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const onFinish = (values: any) => {
        setProcessing(true);
        const submitData = {
            ...values,
            is_active: values.is_active ? 1 : 0,
        };

        if (editingField) {
            router.put(`/tenant/${tenantSlug}/fields/${editingField.id}`, submitData, {
                onSuccess: () => {
                    handleCancel();
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/tenant/${tenantSlug}/fields`, submitData, {
                onSuccess: () => {
                    handleCancel();
                    setProcessing(false);
                },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/tenant/${tenantSlug}/fields/${id}`, {
            onSuccess: () => message.success('Xóa sân thành công!'),
        });
    };

    const columns = [
        {
            title: 'Tên Sân',
            dataIndex: 'name',
            key: 'name',
            fontWeight: 'bold',
        },
        {
            title: 'Loại Sân',
            key: 'field_type',
            render: (_: any, record: Field) => (
                <Tag color="blue">{record.field_type?.name || 'N/A'}</Tag>
            ),
        },
        {
            title: 'Khu vực/Vị trí',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'error'}>
                    {isActive ? 'Đang hoạt động' : 'Đang bảo trì'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: Field) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa sân này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Head title="Quản lý Sân" />
            
            <Card 
                title="Danh sách Sân" 
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Thêm sân mới</Button>}
                variant="borderless"
            >
                <Table 
                    columns={columns} 
                    dataSource={fields} 
                    rowKey="id" 
                    pagination={{ pageSize: 10 }} 
                />
            </Card>

            <Modal
                title={editingField ? "Sửa thông tin sân" : "Thêm sân mới"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="name"
                        label="Tên sân"
                        rules={[{ required: true, message: 'Vui lòng nhập tên sân' }]}
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                    >
                        <Input placeholder="VD: Sân bóng số 1" />
                    </Form.Item>

                    <Form.Item
                        name="field_type_id"
                        label="Loại sân"
                        rules={[{ required: true, message: 'Vui lòng chọn loại sân' }]}
                        validateStatus={errors.field_type_id ? 'error' : ''}
                        help={errors.field_type_id}
                    >
                        <Select placeholder="Chọn loại sân">
                            {fieldTypes.map(type => (
                                <Select.Option key={type.id} value={type.id}>
                                    {type.name} ({type.sport})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="location" label="Khu vực/Vị trí">
                        <Input placeholder="VD: Khu A, Tầng 1..." />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả thêm về sân (nếu có)" />
                    </Form.Item>

                    <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Bảo trì" />
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
        </div>
    );
}

// 2. Gán Persistent Layout để trang hiện lên bên cạnh Sidebar mà không bị load lại cả trang
FieldIndex.layout = (page: React.ReactNode) => <TenantLayout children={page} />;