import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Tag, Popconfirm, message, TimePicker, InputNumber, Radio, Tabs, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
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

interface FieldSpecialEvent {
    id: number;
    field_id: number | null;
    event_date: string;
    start_time: string;
    end_time: string;
    effect: 'surge' | 'block';
    surge_percent: number | null;
    title: string;
    note: string | null;
    field?: Field;
}

interface PageProps {
    [key: string]: any;
    fieldTypes: FieldType[];
    fields: Field[];
    prices: Record<number, FieldPrice[]>;
    specialEvents: FieldSpecialEvent[];
    flash: {
        success?: string;
    };
    errors: Record<string, string> & { error?: string }; 
}

export default function FieldPriceIndex() {
    const { fieldTypes, fields, prices, specialEvents, flash, errors } = usePage<PageProps>().props;
    
    // States cho Cấu hình giá chuẩn
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPrice, setEditingPrice] = useState<FieldPrice | null>(null);
    const [priceScope, setPriceScope] = useState<'all' | 'specific'>('all');
    const [selectedFieldType, setSelectedFieldType] = useState<number | null>(null);
    const [isFieldTypeDisabled, setIsFieldTypeDisabled] = useState(false);

    // States cho Cấu hình sự kiện / ngày lễ
    const [eventForm] = Form.useForm();
    const [isEventModalVisible, setIsEventModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState<FieldSpecialEvent | null>(null);
    const [eventScope, setEventScope] = useState<'all' | 'specific'>('all');
    const [eventEffect, setEventEffect] = useState<'surge' | 'block'>('surge');

    const [processing, setProcessing] = useState(false);
    const tenantSlug = window.location.pathname.split('/')[2];

    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (errors?.error) {
            message.error(errors.error);
        }
    }, [flash, errors]);

    // ==========================================
    // LOGIC CẤU HÌNH GIÁ CHUẨN
    // ==========================================
    const showAddModal = (fieldTypeId?: number) => {
        if (fieldTypeId) {
            const hasFields = fields.some(f => f.field_type_id === fieldTypeId);
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

    const priceColumns = [
        {
            title: 'Áp dụng cho',
            key: 'scope',
            render: (_: any, record: FieldPrice) => {
                if (record.field_id) {
                    const field = fields.find(f => f.id === record.field_id);
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

    const filteredFields = fields.filter(f => f.field_type_id === selectedFieldType);

    // ==========================================
    // LOGIC CẤU HÌNH SỰ KIỆN / NGÀY LỄ
    // ==========================================
    const showAddEventModal = () => {
        if (fields.length === 0) {
            message.warning('Bạn chưa có sân nào. Vui lòng tạo sân trước khi tạo sự kiện.');
            return;
        }
        setEditingEvent(null);
        setEventScope('all');
        setEventEffect('surge');
        eventForm.resetFields();
        eventForm.setFieldsValue({
            effect: 'surge',
            start_time: dayjs('00:00:00', 'HH:mm:ss'),
            end_time: dayjs('23:59:59', 'HH:mm:ss'),
            surge_percent: 50
        });
        setIsEventModalVisible(true);
    };

    const showEditEventModal = (record: FieldSpecialEvent) => {
        setEditingEvent(record);
        setEventScope(record.field_id ? 'specific' : 'all');
        setEventEffect(record.effect);
        eventForm.setFieldsValue({
            ...record,
            event_date: dayjs(record.event_date),
            start_time: dayjs(record.start_time, 'HH:mm:ss'),
            end_time: dayjs(record.end_time, 'HH:mm:ss'),
            surge_percent: record.surge_percent
        });
        setIsEventModalVisible(true);
    };

    const handleEventCancel = () => {
        setIsEventModalVisible(false);
        eventForm.resetFields();
        setEditingEvent(null);
    };

    const onEventFinish = (values: any) => {
        setProcessing(true);
        const submitData = {
            ...values,
            field_id: eventScope === 'all' ? null : values.field_id,
            event_date: values.event_date.format('YYYY-MM-DD'),
            start_time: values.start_time.format('HH:mm:ss'),
            end_time: values.end_time.format('HH:mm:ss'),
            surge_percent: values.effect === 'surge' ? values.surge_percent : null
        };

        if (editingEvent) {
            router.put(`/tenant/${tenantSlug}/field-prices/special-events/${editingEvent.id}`, submitData, {
                onSuccess: () => { setIsEventModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(`/tenant/${tenantSlug}/field-prices/special-events`, submitData, {
                onSuccess: () => { setIsEventModalVisible(false); setProcessing(false); },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleEventDelete = (id: number) => {
        router.delete(`/tenant/${tenantSlug}/field-prices/special-events/${id}`);
    };

    const eventColumns = [
        {
            title: 'Tên sự kiện / Ngày lễ',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: FieldSpecialEvent) => (
                <div>
                    <strong>{text}</strong>
                    {record.note && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.note}</div>}
                </div>
            )
        },
        {
            title: 'Áp dụng cho',
            key: 'scope',
            render: (_: any, record: FieldSpecialEvent) => {
                if (record.field_id) {
                    const field = fields.find(f => f.id === record.field_id);
                    return <Tag color="purple"><EnvironmentOutlined /> {field?.name || 'Sân đã xóa'}</Tag>;
                }
                return <Tag color="blue">Tất cả các sân</Tag>;
            }
        },
        {
            title: 'Ngày diễn ra',
            dataIndex: 'event_date',
            key: 'event_date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY')
        },
        {
            title: 'Khung giờ',
            key: 'time_slot',
            render: (_: any, record: FieldSpecialEvent) => (
                <span>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {record.start_time.substring(0, 5)} - {record.end_time.substring(0, 5)}
                </span>
            )
        },
        {
            title: 'Tác động / Phụ thu',
            key: 'effect',
            render: (_: any, record: FieldSpecialEvent) => {
                if (record.effect === 'surge') {
                    return (
                        <Tag color="red">
                            Tăng giá +{record.surge_percent}%
                        </Tag>
                    );
                }
                return <Tag color="default">Khóa sân (Không nhận đặt)</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: FieldSpecialEvent) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => showEditEventModal(record)} />
                    <Popconfirm
                        title="Xác nhận xóa sự kiện?"
                        onConfirm={() => handleEventDelete(record.id)}
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

    // ==========================================
    // TAB ITEMS CONFIGURATION
    // ==========================================
    const tabItems = [
        {
            key: '1',
            label: (
                <span>
                    <ClockCircleOutlined /> Giá chuẩn theo giờ
                </span>
            ),
            children: (
                <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
                                columns={priceColumns} 
                                dataSource={prices[type.id] || []} 
                                rowKey="id" 
                                pagination={false}
                                locale={{ emptyText: 'Chưa có cấu hình giá cho loại sân này' }}
                            />
                        </Card>
                    ))}
                </div>
            )
        },
        {
            key: '2',
            label: (
                <span>
                    <CalendarOutlined /> Phụ thu ngày lễ & Sự kiện
                </span>
            ),
            children: (
                <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ color: '#8c8c8c' }}>
                            Thiết lập các sự kiện tăng giá hoặc tạm thời khóa sân vào các dịp đặc biệt / nghỉ lễ.
                        </div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={showAddEventModal}>Thêm sự kiện mới</Button>
                    </div>
                    <Card>
                        <Table 
                            columns={eventColumns} 
                            dataSource={specialEvents || []} 
                            rowKey="id" 
                            pagination={{ pageSize: 10 }}
                            locale={{ emptyText: 'Chưa có cấu hình ngày lễ / sự kiện đặc biệt nào' }}
                        />
                    </Card>
                </div>
            )
        }
    ];

    return (
        <div>
            <Head title="Cấu hình giá sân & Ngày lễ" />
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 24 }}>Cấu hình giá sân & Ngày lễ</h1>
            </div>

            <Tabs defaultActiveKey="1" items={tabItems} style={{ background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }} />

            {/* MODAL CẤU HÌNH GIÁ CHUẨN */}
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

            {/* MODAL CẤU HÌNH SỰ KIỆN / NGÀY LỄ */}
            <Modal 
                title={editingEvent ? "Sửa sự kiện / ngày lễ" : "Thêm sự kiện / ngày lễ mới"} 
                open={isEventModalVisible} 
                onCancel={handleEventCancel} 
                footer={null}
                destroyOnClose
            >
                <Form form={eventForm} layout="vertical" onFinish={onEventFinish}>
                    <Form.Item name="title" label="Tên sự kiện / Ngày lễ" rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện / ngày lễ (ví dụ: Tết Quốc Khánh 2/9)' }]}>
                        <Input placeholder="Nhập tên sự kiện..." />
                    </Form.Item>

                    <Form.Item label="Sân áp dụng">
                        <Radio.Group value={eventScope} onChange={e => setEventScope(e.target.value)}>
                            <Radio value="all">Tất cả các sân</Radio>
                            <Radio value="specific">Chỉ áp dụng cho một sân cụ thể</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {eventScope === 'specific' && (
                        <Form.Item name="field_id" label="Chọn sân cụ thể" rules={[{ required: true, message: 'Vui lòng chọn sân' }]}>
                            <Select placeholder="Chọn sân">
                                {fields.map(f => (
                                    <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item name="event_date" label="Ngày diễn ra sự kiện" rules={[{ required: true, message: 'Vui lòng chọn ngày sự kiện' }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Space size="large" style={{ display: 'flex' }}>
                        <Form.Item name="start_time" label="Giờ bắt đầu" rules={[{ required: true }]}>
                            <TimePicker format="HH:mm" />
                        </Form.Item>
                        <Form.Item name="end_time" label="Giờ kết thúc" rules={[{ required: true }]}>
                            <TimePicker format="HH:mm" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="effect" label="Tác động" rules={[{ required: true }]}>
                        <Radio.Group onChange={e => setEventEffect(e.target.value)}>
                            <Radio value="surge">Tăng giá (Phụ thu theo %)</Radio>
                            <Radio value="block">Khóa sân (Không cho phép đặt sân)</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {eventEffect === 'surge' && (
                        <Form.Item name="surge_percent" label="Tỷ lệ tăng giá (%)" rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ tăng giá' }]}>
                            <InputNumber 
                                style={{ width: '100%' }} 
                                min={0} 
                                max={500} 
                                addonAfter="%" 
                                placeholder="Ví dụ: 50 để tăng 50% giá giờ chuẩn"
                            />
                        </Form.Item>
                    )}

                    <Form.Item name="note" label="Ghi chú thêm">
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết sự kiện (không bắt buộc)..." />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleEventCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processing}>
                                Lưu sự kiện
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

FieldPriceIndex.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
