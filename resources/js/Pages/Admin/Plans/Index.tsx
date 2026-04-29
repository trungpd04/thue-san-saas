import React, { useState } from 'react';
import { Typography, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Switch, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layout/Admin/AdminLayout'; // Đường dẫn import Layout của team bạn

const { Title } = Typography;

// Khai báo kiểu dữ liệu cho Plan
interface Plan {
    id: number;
    name: string;
    max_fields: number;
    max_staff: number;
    price_monthly: number;
    price_yearly: number;
    is_active: boolean;
}

interface PageProps {
    plans: Plan[];
}

export default function Index({ plans }: PageProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [form] = Form.useForm();

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '', max_fields: 1, max_staff: 1, price_monthly: 0, price_yearly: 0, is_active: true
    });

    const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const openModal = (plan: Plan | null = null) => {
        setEditingPlan(plan);
        if (plan) {
            setData(plan as any);
            form.setFieldsValue(plan);
        } else {
            reset();
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleSubmit = () => {
        if (editingPlan) {
            put(`/admin/plans/${editingPlan.id}`, {
                onSuccess: () => {
                    message.success('Cập nhật thành công!');
                    setIsModalVisible(false);
                }
            });
        } else {
            post('/admin/plans', {
                onSuccess: () => {
                    message.success('Thêm mới thành công!');
                    setIsModalVisible(false);
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/admin/plans/${id}`, {
            onSuccess: () => message.success('Đã vô hiệu hóa gói dịch vụ!')
        });
    };

    const columns = [
        { title: 'Tên Gói', dataIndex: 'name', key: 'name', render: (text: string) => <b>{text}</b> },
        { title: 'Số Sân Tối Đa', dataIndex: 'max_fields', key: 'max_fields' },
        { title: 'Số Nhân Viên', dataIndex: 'max_staff', key: 'max_staff' },
        { title: 'Giá Tháng', dataIndex: 'price_monthly', key: 'price_monthly', render: (val: number) => formatVND(val) },
        { title: 'Giá Năm', dataIndex: 'price_yearly', key: 'price_yearly', render: (val: number) => formatVND(val) },
        { 
            title: 'Trạng Thái', dataIndex: 'is_active', key: 'is_active',
            render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>
        },
        {
            title: 'Hành động', key: 'actions',
            render: (_: any, record: Plan) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} />
                    {record.is_active && (
                        <Popconfirm title="Vô hiệu hóa gói này?" onConfirm={() => handleDelete(record.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <AdminLayout>
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Title level={3}>Quản Lý Gói Dịch Vụ (Plans)</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        Thêm Gói Mới
                    </Button>
                </div>

                <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Table columns={columns} dataSource={plans} rowKey="id" pagination={{ pageSize: 10 }} />
                </Card>

                <Modal 
                    title={editingPlan ? "Chỉnh sửa Gói" : "Thêm Gói Mới"}
                    open={isModalVisible} 
                    onOk={form.submit} 
                    onCancel={() => setIsModalVisible(false)} 
                    confirmLoading={processing}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item label="Tên Gói Dịch Vụ" name="name" rules={[{ required: true }]}>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} />
                        </Form.Item>
                        
                        <Space style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                            <Form.Item label="Giới hạn Sân bóng" name="max_fields" rules={[{ required: true }]}>
                                <InputNumber min={1} value={data.max_fields} onChange={val => setData('max_fields', val ?? 1)} />
                            </Form.Item>
                            <Form.Item label="Giới hạn Nhân viên" name="max_staff" rules={[{ required: true }]}>
                                <InputNumber min={1} value={data.max_staff} onChange={val => setData('max_staff', val ?? 1)} />
                            </Form.Item>
                        </Space>

                        <Space style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                            <Form.Item label="Giá Tháng (VNĐ)" name="price_monthly" rules={[{ required: true }]}>
                                <InputNumber min={0} value={data.price_monthly} onChange={val => setData('price_monthly', val ?? 0)} style={{ width: 180 }} />
                            </Form.Item>
                            <Form.Item label="Giá Năm (VNĐ)" name="price_yearly" rules={[{ required: true }]}>
                                <InputNumber min={0} value={data.price_yearly} onChange={val => setData('price_yearly', val ?? 0)} style={{ width: 180 }} />
                            </Form.Item>
                        </Space>

                        <Form.Item label="Trạng thái" name="is_active" valuePropName="checked">
                            <Switch checked={data.is_active} onChange={checked => setData('is_active', checked)} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AdminLayout>
    );
}