import { Head, router, usePage } from '@inertiajs/react';
import { Button, Card, Col, Form, Input, Row, Typography } from 'antd';
import React, { useMemo, useState } from 'react';

const GREEN_MA = '#7CB305';

type RegisterPageProps = {
    errors?: Record<string, string | string[] | undefined>;
};

export default function Register() {
    const { errors = {} } = usePage<RegisterPageProps>().props;
    const [form] = Form.useForm();
    const [processing, setProcessing] = useState(false);

    const slugExtra = useMemo(() => {
        return (
            <Typography.Text type="secondary">
                Slug sẽ được dùng trong URL (vd: <Typography.Text code>/tenant/acme/...</Typography.Text>).
            </Typography.Text>
        );
    }, []);

    const onFinish = (values: {
        tenant_name: string;
        tenant_phone?: string;
        tenant_address?: string;
        slug: string;
        owner_name: string;
        owner_email: string;
        owner_password: string;
        owner_password_confirmation: string;
    }) => {
        router.post(
            '/register',
            {
                tenant_name: values.tenant_name,
                tenant_phone: values.tenant_phone,
                tenant_address: values.tenant_address,
                slug: values.slug,
                owner_name: values.owner_name,
                owner_email: values.owner_email,
                owner_password: values.owner_password,
                owner_password_confirmation: values.owner_password_confirmation,
            },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Đăng ký tenant" />
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #f5f7e8 0%, #eef2f6 100%)',
                    padding: 24,
                }}
            >
                <Card
                    style={{
                        width: '100%',
                        maxWidth: 860,
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0, 21, 41, 0.08)',
                    }}
                >
                    <Typography.Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
                        Tạo sân mới
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                        Tạo tenant + tài khoản owner (manager) để bắt đầu quản lý
                    </Typography.Paragraph>

                    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Typography.Title level={5} style={{ marginTop: 0 }}>
                                    Thông tin tenant
                                </Typography.Title>

                                <Form.Item
                                    name="tenant_name"
                                    label="Tên sân"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên sân.' }]}
                                    validateStatus={errors?.tenant_name ? 'error' : undefined}
                                    help={errors?.tenant_name}
                                >
                                    <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="slug"
                                    label="Slug subdomain"
                                    extra={slugExtra}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập slug.' },
                                        {
                                            pattern: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i,
                                            message: 'Slug chỉ gồm chữ/số và dấu gạch ngang, không bắt đầu/kết thúc bằng gạch ngang.',
                                        },
                                    ]}
                                    validateStatus={errors?.slug ? 'error' : undefined}
                                    help={errors?.slug}
                                >
                                    <Input size="large" placeholder="acme" />
                                </Form.Item>

                                <Form.Item
                                    name="tenant_phone"
                                    label="Số điện thoại"
                                    validateStatus={errors?.tenant_phone ? 'error' : undefined}
                                    help={errors?.tenant_phone}
                                >
                                    <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="tenant_address"
                                    label="Địa chỉ"
                                    validateStatus={errors?.tenant_address ? 'error' : undefined}
                                    help={errors?.tenant_address}
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Typography.Title level={5} style={{ marginTop: 0 }}>
                                    Tài khoản owner
                                </Typography.Title>

                                <Form.Item
                                    name="owner_name"
                                    label="Họ tên"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}
                                    validateStatus={errors?.owner_name ? 'error' : undefined}
                                    help={errors?.owner_name}
                                >
                                    <Input size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="owner_email"
                                    label="Email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email.' },
                                        { type: 'email', message: 'Email không hợp lệ.' },
                                    ]}
                                    validateStatus={errors?.owner_email ? 'error' : undefined}
                                    help={errors?.owner_email}
                                >
                                    <Input size="large" autoComplete="username" />
                                </Form.Item>

                                <Form.Item
                                    name="owner_password"
                                    label="Mật khẩu"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu (tối thiểu 8 ký tự).' }, { min: 8 }]}
                                    validateStatus={errors?.owner_password ? 'error' : undefined}
                                    help={errors?.owner_password}
                                >
                                    <Input.Password size="large" autoComplete="new-password" />
                                </Form.Item>

                                <Form.Item
                                    name="owner_password_confirmation"
                                    label="Nhập lại mật khẩu"
                                    dependencies={['owner_password']}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập lại mật khẩu.' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('owner_password') === value) return Promise.resolve();
                                                return Promise.reject(new Error('Mật khẩu nhập lại không khớp.'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password size="large" autoComplete="new-password" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={processing}
                            style={{ background: GREEN_MA, marginTop: 8 }}
                        >
                            Tạo tenant
                        </Button>
                    </Form>
                </Card>
            </div>
        </>
    );
}

