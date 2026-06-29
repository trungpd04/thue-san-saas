import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Tag, Popconfirm, message, TimePicker, InputNumber, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import TenantLayout from '../../../Layout/Tenant/TenantLayout'; 
import dayjs from 'dayjs';

interface FieldType {
    id: number;
    name: string;
    sport: string;
}

interface Field {
    id: number;
    name: string;
    field_type_id: number;
}

interface FieldPrice {
    id: number;
    field_type_id: number;
    field_id: number | null;
    start_time: string;
    end_time: string;
    day_type: 'weekday' | 'weekend';
    price_per_hour: string | number;
}

interface PageProps {
    [key: string]: any;
    fieldTypes: FieldType[];
    fields: Field[];
    prices: Record<number, FieldPrice[]>;
    flash: {
        success?: string;
    };
    errors: Record<string, string> & { error?: string }; 
}

export default function FieldPriceIndex() {
    const { fieldTypes, fields, prices, flash, errors } = usePage<PageProps>().props;
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPrice, setEditingPrice] = useState<FieldPrice | null>(null);
    const [processing, setProcessing] = useState(false);
    const [priceScope, setPriceScope] = useState<'all' | 'specific'>('all');
    const [selectedFieldType, setSelectedFieldType] = useState<number | null>(null);
    const [isFieldTypeDisabled, setIsFieldTypeDisabled] = useState(false);

    const tenantSlug = window.location.pathname.split('/')[2];

    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (errors?.error) {
            message.error(errors.error);
        }
    }, [flash, errors]);

    const showAddModal = (fieldTypeId?: number) => {
        if (fieldTypeId) {
            const hasFields = fields.some(f => Number(f.field_type_id) === Number(fieldTypeId));
            if (!hasFields) {
                message.warning('Bạn chưa có sân nào thuộc loại này. Vui lòng tạo sân trước khi cấu hình giá.');
                return;
            }
            setIsFieldTypeDisabled(true);
        } else {
            if (fields.length === 0) {
                message.warning('Bạn chưa có sân nào. Vui lòng tạo sân trước khi cấu hình giá.');
                return;
            }
            setIsFieldTypeDisabled(false);
        }

        setEditingPrice(null);
        setPriceScope('all');
        form.resetFields();
        if (fieldTypeId) {
            form.setFieldsValue({ field_type_id: fieldTypeId });
            setSelectedFieldType(fieldTypeId);
        }
        form.setFieldsValue({ day_type: 'weekday' });
        setIsModalVisible(true);
    };

    const showEditModal = (record: FieldPrice) => {
        setEditingPrice(record);
        setPriceScope(record.field_id ? 'specific' : 'all');
        setSelectedFieldType(record.field_type_id);
        setIsFieldTypeDisabled(true);
        form.setFieldsValue({
            ...record,
            start_time: dayjs(record.start_time, 'HH:mm:ss'),
            end_time: dayjs(record.end_time, 'HH:mm:ss'),
            price_per_hour: Number(record.price_per_hour)
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingPrice(null);
        setSelectedFieldType(null);
        setIsFieldTypeDisabled(false);
    };

    const onFinish = (values: any) => {
        setProcessing(true);
        const submitData = {
            ...values,
            field_id: priceScope === 'all' ? null : values.field_id,
            start_time: values.start_time.format('HH:mm:ss'),
            end_time: values.end_time.format('HH:mm:ss'),
        };

        if (editingPrice) {
            router.put(`/tenant/${tenantSlug}/field-prices/${editingPrice.id}`, submitData, {
                onSuccess: () => { setIsModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/tenant/${tenantSlug}/field-prices`, submitData, {
                onSuccess: () => { setIsModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/tenant/${tenantSlug}/field-prices/${id}`);
    };

    const columns = [
        {
            title: 'Áp dụng cho',
            key: 'scope',
            render: (_: any, record: FieldPrice) => {
                if (record.field_id) {
                    const field = fields.find(f => Number(f.id) === Number(record.field_id));
                    return <Tag color="purple"><EnvironmentOutlined /> {field?.name || 'Sân đã xóa'}</Tag>;
                }
                return <Tag color="blue">Tất cả sân trong loại này</Tag>;
            }
        },
        {
            title: 'Loại ngày',
            dataIndex: 'day_type',
            key: 'day_type',
            render: (type: string) => (
                <Tag color={type === 'weekday' ? 'green' : 'orange'}>
                    {type === 'weekday' ? 'Ngày thường' : 'Cuối tuần'}
                </Tag>
            )
        },
        {
            title: 'Khung giờ',
            key: 'time_slot',
            render: (_: any, record: FieldPrice) => (
                <span>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {record.start_time.substring(0, 5)} - {record.end_time.substring(0, 5)}
                </span>
            )
        },
        {
            title: 'Giá / Giờ',
            dataIndex: 'price_per_hour',
            key: 'price_per_hour',
            render: (price: any) => (
                <strong style={{ color: '#f5222d' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                </strong>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: FieldPrice) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
                    <Popconfirm
                        title="Xác nhận xóa khung giá?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const filteredFields = fields.filter(f => Number(f.field_type_id) === Number(selectedFieldType));

    return (
        <div>
            <Head title="Cấu hình giá sân" />
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 24 }}>Cấu hình bảng giá sân</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddModal()}>Thêm khung giá mới</Button>
            </div>

            {fieldTypes.map(type => (
                <Card 
                    key={type.id} 
                    title={<span style={{ fontSize: 18 }}>{type.name} ({type.sport})</span>} 
                    style={{ marginBottom: 24 }}
                    extra={<Button type="link" icon={<PlusOutlined />} onClick={() => showAddModal(type.id)}>Thêm giá cho loại này</Button>}
                >
                    <Table 
                        columns={columns} 
                        dataSource={prices[type.id] || []} 
                        rowKey="id" 
                        pagination={false}
                        locale={{ emptyText: 'Chưa có cấu hình giá cho loại sân này' }}
                    />
                </Card>
            ))}

            <Modal 
                title={editingPrice ? "Sửa khung giá" : "Thêm khung giá mới"} 
                open={isModalVisible} 
                onCancel={handleCancel} 
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="field_type_id" label="Loại sân" rules={[{ required: true, message: 'Vui lòng chọn loại sân' }]}>
                        <Select 
                            placeholder="Chọn loại sân" 
                            disabled={isFieldTypeDisabled}
                            onChange={(val) => {
                                setSelectedFieldType(val);
                                form.setFieldsValue({ field_id: null });
                            }}
                        >
                            {fieldTypes.map(t => (
                                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Phạm vi áp dụng">
                        <Radio.Group value={priceScope} onChange={e => setPriceScope(e.target.value)}>
                            <Radio value="all">Tất cả sân thuộc loại này</Radio>
                            <Radio value="specific">Chỉ áp dụng cho sân cụ thể</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {priceScope === 'specific' && (
                        <Form.Item name="field_id" label="Chọn sân cụ thể" rules={[{ required: true, message: 'Vui lòng chọn sân' }]}>
                            <Select placeholder="Chọn sân">
                                {filteredFields.map(f => (
                                    <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item name="day_type" label="Loại ngày" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="weekday">Ngày thường (Thứ 2 - Thứ 6)</Select.Option>
                            <Select.Option value="weekend">Cuối tuần (Thứ 7, CN)</Select.Option>
                        </Select>
                    </Form.Item>

                    <Space size="large" style={{ display: 'flex' }}>
                        <Form.Item name="start_time" label="Giờ bắt đầu" rules={[{ required: true }]}>
                            <TimePicker format="HH:mm" />
                        </Form.Item>
                        <Form.Item name="end_time" label="Giờ kết thúc" rules={[{ required: true }]}>
                            <TimePicker format="HH:mm" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="price_per_hour" label="Giá mỗi giờ (VND)" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
                        <InputNumber 
                            style={{ width: '100%' }} 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                            min={0}
                            step={10000}
                        />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processing}>
                                Lưu cấu hình
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

FieldPriceIndex.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
