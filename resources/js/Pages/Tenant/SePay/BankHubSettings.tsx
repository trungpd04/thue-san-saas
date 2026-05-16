import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layout/Tenant/TenantLayout';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Result,
    Row,
    Select,
    Skeleton,
    Space,
    Spin,
    Steps,
    Table,
    Tag,
    Typography,
} from 'antd';
import {
    BankOutlined,
    CheckCircleFilled,
    ReloadOutlined,
    SafetyCertificateOutlined,
    ScanOutlined,
    SyncOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface BankAccount {
    xid: string;
    brand_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_api_connected?: string;
    active?: string | number | boolean;
}

interface Props {
    hostedLink: string | null;
    isLinked: boolean;
    companyXid: string | null;
    bankAccounts: BankAccount[];
    sandbox: {
        enabled: boolean;
        environment: string;
    };
    error: string | null;
}

export default function BankHubSettings({
    hostedLink,
    isLinked,
    companyXid,
    bankAccounts = [],
    sandbox,
    error,
}: Props) {
    const { props } = usePage<any>();
    const slug = props.tenancy?.tenant?.slug;
    const base = slug ? `/tenant/${slug}` : '/tenant';
    const { data, setData, post, processing, errors, reset } = useForm({
        bank_account_xid: bankAccounts[0]?.xid ?? '',
        amount: 100000,
        content: '',
    });

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const eventType = event.data?.event;

            if (!eventType) return;

            if (eventType === 'FINISHED_BANK_ACCOUNT_LINK') {
                router.reload();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    React.useEffect(() => {
        if (!data.bank_account_xid && bankAccounts[0]?.xid) {
            setData('bank_account_xid', bankAccounts[0].xid);
        }
    }, [bankAccounts]);

    const submitSandboxTransaction = () => {
        post(`${base}/sepay/sandbox-transaction`, {
            preserveScroll: true,
            onSuccess: () => reset('content'),
        });
    };

    const accountOptions = bankAccounts.map((account) => ({
        value: account.xid,
        label: `${account.brand_name ?? 'Bank'} - ${account.account_number ?? account.xid}`,
    }));

    return (
        <TenantLayout>
            <Head title="SePay Bank Hub Sandbox" />

            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                        <div>
                            <Title level={2} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <BankOutlined style={{ color: '#7CB305' }} />
                                SePay Bank Hub
                            </Title>
                            <Text type="secondary">
                                Tích hợp nhận tiền đặt sân cho chủ sân trong môi trường sandbox/dev.
                            </Text>
                        </div>
                        <Tag color={sandbox?.enabled ? 'green' : 'red'} style={{ marginTop: 8 }}>
                            {sandbox?.environment ?? 'sandbox'}
                        </Tag>
                    </div>

                    {!sandbox?.enabled && (
                        <Alert
                            type="error"
                            showIcon
                            message="Bank Hub đang bị khóa"
                            description="Tính năng này chỉ được phép chạy với SEPAY_BANKHUB_ENV=sandbox và API URL sandbox."
                        />
                    )}

                    {error && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Không thể đồng bộ Bank Hub"
                            description={error}
                            action={
                                <Button icon={<ReloadOutlined />} onClick={() => router.reload()}>
                                    Thử lại
                                </Button>
                            }
                        />
                    )}

                    {isLinked ? (
                        <Result
                            status="success"
                            title="Đã liên kết tài khoản ngân hàng sandbox"
                            subTitle={
                                <Space direction="vertical" align="center">
                                    <Text>Hệ thống có thể nhận webhook giao dịch sandbox và tự động chốt đơn đặt sân.</Text>
                                    {companyXid && <Text type="secondary">Company XID: {companyXid}</Text>}
                                </Space>
                            }
                        />
                    ) : (
                        <Row gutter={[24, 24]}>
                            <Col xs={24} lg={10}>
                                <Card bordered={false}>
                                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                        <div>
                                            <Title level={4}>Liên kết ngân hàng sandbox</Title>
                                            <Paragraph type="secondary">
                                                Chủ sân dùng Hosted Link của SePay Bank Hub để liên kết tài khoản ngân hàng test.
                                                Secret và token chỉ được gọi từ backend.
                                            </Paragraph>
                                        </div>

                                        <Steps
                                            direction="vertical"
                                            current={0}
                                            items={[
                                                {
                                                    title: 'Tạo company trên SePay',
                                                    description: companyXid ? `Đã có XID: ${companyXid}` : 'Tạo tự động khi mở trang.',
                                                    icon: <ScanOutlined />,
                                                },
                                                {
                                                    title: 'Mở Hosted Link',
                                                    description: 'Nhúng iframe sandbox để chủ sân liên kết tài khoản.',
                                                    icon: <SyncOutlined />,
                                                },
                                                {
                                                    title: 'Nhận webhook',
                                                    description: 'Webhook sandbox cập nhật booking khi có nội dung BK{id}.',
                                                    icon: <CheckCircleFilled />,
                                                },
                                            ]}
                                        />

                                        <Divider />

                                        <Alert
                                            message="Chỉ dùng cho dev"
                                            description="Không dùng cấu hình này cho giao dịch thật. Production đang được chặn ở service."
                                            type="info"
                                            showIcon
                                            icon={<SafetyCertificateOutlined />}
                                        />
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} lg={14}>
                                <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ overflow: 'hidden', minHeight: 650 }}>
                                    {hostedLink ? (
                                        <iframe
                                            src={hostedLink}
                                            style={{ width: '100%', height: 650, border: 'none' }}
                                            title="SePay Bank Hub Sandbox"
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 650 }}>
                                            <Spin size="large" tip="Đang khởi tạo Hosted Link sandbox..." />
                                            <div style={{ marginTop: 24, width: '80%' }}>
                                                <Skeleton active paragraph={{ rows: 4 }} />
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {bankAccounts.length > 0 && (
                        <Card title="Tài khoản đã liên kết">
                            <Table
                                rowKey="xid"
                                pagination={false}
                                dataSource={bankAccounts}
                                columns={[
                                    {
                                        title: 'Ngân hàng',
                                        dataIndex: 'brand_name',
                                        render: (value) => value || '-',
                                    },
                                    {
                                        title: 'Số tài khoản',
                                        dataIndex: 'account_number',
                                        render: (value) => value || '-',
                                    },
                                    {
                                        title: 'Chủ tài khoản',
                                        dataIndex: 'account_holder_name',
                                        render: (value) => value || '-',
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'active',
                                        render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag>,
                                    },
                                ]}
                            />
                        </Card>
                    )}

                    {bankAccounts.length > 0 && sandbox?.enabled && (
                        <Card title="Tạo giao dịch sandbox">
                            <Form layout="vertical" onFinish={submitSandboxTransaction}>
                                <Row gutter={16}>
                                    <Col xs={24} md={8}>
                                        <Form.Item label="Tài khoản nhận" validateStatus={errors.bank_account_xid ? 'error' : undefined} help={errors.bank_account_xid}>
                                            <Select
                                                options={accountOptions}
                                                value={data.bank_account_xid}
                                                onChange={(value) => setData('bank_account_xid', value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Form.Item label="Số tiền" validateStatus={errors.amount ? 'error' : undefined} help={errors.amount}>
                                            <InputNumber
                                                min={1000}
                                                step={10000}
                                                style={{ width: '100%' }}
                                                value={data.amount}
                                                onChange={(value) => setData('amount', Number(value ?? 0))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={10}>
                                        <Form.Item label="Nội dung chuyển khoản" validateStatus={errors.content ? 'error' : undefined} help={errors.content}>
                                            <Input
                                                placeholder="VD: THANH TOAN BK123"
                                                value={data.content}
                                                onChange={(event) => setData('content', event.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Button type="primary" htmlType="submit" loading={processing}>
                                    Tạo giao dịch sandbox
                                </Button>
                            </Form>
                        </Card>
                    )}
                </Space>
            </div>
        </TenantLayout>
    );
}
