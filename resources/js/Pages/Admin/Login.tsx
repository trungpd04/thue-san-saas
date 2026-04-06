import { Head, router, usePage } from '@inertiajs/react';
import { Button, Card, Checkbox, Form, Input, Typography } from 'antd';
import React, { useState } from 'react';

const GREEN_MA = '#7CB305';

type LoginPageProps = {
    errors?: Record<string, string | string[] | undefined>;
};

export default function Login() {
    const { errors = {} } = usePage<LoginPageProps>().props;
    const [form] = Form.useForm();
    const [processing, setProcessing] = useState(false);

    const onFinish = (values: { email: string; password: string; remember?: boolean }) => {
        router.post(
            '/admin/login',
            {
                email: values.email,
                password: values.password,
                remember: Boolean(values.remember),
            },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Đăng nhập quản trị" />
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
                        maxWidth: 400,
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0, 21, 41, 0.08)',
                    }}
                >
                    <Typography.Title level={3} style={{ marginTop: 0, textAlign: 'center' }}>
                        Quản trị ThueSan
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                        Đăng nhập bằng tài khoản admin
                    </Typography.Paragraph>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark="optional"
                        initialValues={{ remember: false }}
                    >
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email.' },
                                { type: 'email', message: 'Email không hợp lệ.' },
                            ]}
                            validateStatus={errors?.email ? 'error' : undefined}
                            help={errors?.email}
                        >
                            <Input size="large" autoComplete="username" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
                            validateStatus={errors?.password ? 'error' : undefined}
                            help={errors?.password}
                        >
                            <Input.Password size="large" autoComplete="current-password" />
                        </Form.Item>

                        <Form.Item name="remember" valuePropName="checked">
                            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={processing}
                            style={{ background: GREEN_MA }}
                        >
                            Đăng nhập
                        </Button>
                    </Form>
                </Card>
            </div>
        </>
    );
}
