import React, { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import {
    Card,
    Button,
    Row,
    Col,
    Typography,
    Tag,
    Space,
    Divider,
    InputNumber,
    Steps,
    Result,
    Alert,
    Table,
} from "antd";
import {
    CheckCircleOutlined,
    CreditCardOutlined,
    InfoCircleOutlined,
    CopyOutlined,
    CheckOutlined,
} from "@ant-design/icons";
import TenantLayout from "@/Layout/Tenant/TenantLayout";
import axios from "axios";
import { App } from "antd";
import { formatVND } from "@/utils/currency";

const { Title, Text, Paragraph } = Typography;

interface Plan {
    id: number;
    name: string;
    price_monthly: string | number;
    max_fields: number;
    max_staff: number;
}

type RegisterPageProps = {
    tenancy?: {
        tenant?: {
            slug?: string;
        } | null;
    };
};

export default function Register({
    plans = [],
    currentSubscription,
}: {
    plans: Plan[];
    currentSubscription: any;
}) {
    const { tenancy } = usePage<RegisterPageProps>().props;
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [months, setMonths] = useState(1);
    const [loading, setLoading] = useState(false);
    const tenantBasePath = tenancy?.tenant?.slug
        ? `/tenant/${tenancy.tenant.slug}`
        : "/tenant";

    // tính ngày hết hạn báo trước 7 ngày
    const endsAt = currentSubscription?.ends_at
        ? new Date(currentSubscription.ends_at)
        : null;
    const today = new Date();
    const isExpiringSoon =
        endsAt &&
        (endsAt.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7;

    const currentSubColumns = [
        {
            title: "Gói đang sử dụng",
            dataIndex: ["plan", "name"],
            key: "plan_name",
            render: (text: string) => (
                <Text strong style={{ color: '#1890ff' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "starts_at",
            key: "starts_at",
            render: (date: string) =>
                date ? new Date(date).toLocaleDateString("vi-VN") : "-",
        },
        {
            title: "Ngày hết hạn",
            dataIndex: "ends_at",
            key: "ends_at",
            render: (date: string) => (
                <Text
                    type={isExpiringSoon ? "danger" : undefined}
                    strong={isExpiringSoon ? true : false}
                >
                    {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
                </Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={status === "active" ? "green" : "blue"}>
                    {status === "active" ? "Đang hoạt động" : "Dùng thử"}
                </Tag>
            ),
        },
    ];

    // const formatCurrency = (amount: number) => {
    //     return new Intl.NumberFormat("vi-VN", {
    //         style: "currency",
    //         currency: "VND",
    //     }).format(amount);
    // };
    const { message } = App.useApp();

    const handleCreateRequest = async (plan: Plan) => {
        setSelectedPlan(plan);
        setLoading(true);
        try {
            const response = await axios.post(
                `${tenantBasePath}/subscription/register`,
                {
                    plan_id: plan.id,
                    months: months,
                },
            );
            if (response.data.success) {
                // Chuyển hướng sang trang thanh toán SePay
                window.location.href = `${tenantBasePath}/subscription/sepay-payment?ref=${response.data.transaction_ref}`;
            }
        } catch (err) {
            console.error(err);
            message.error("Có lỗi xảy ra, vui lòng thử lại sau");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
            <Head title="Đăng ký gói dịch vụ" />

            {/* Phần hiển thị Gói hiện tại - Giống index Admin */}
            {currentSubscription && (
                <div style={{ marginBottom: 40 }}>
                    <Title level={4}>Thông tin gói hiện tại</Title>
                    {isExpiringSoon && (
                        <Alert
                            message="Cảnh báo hết hạn"
                            description={`Gói dịch vụ của bạn sẽ hết hạn vào ngày ${new Date(currentSubscription.ends_at).toLocaleDateString("vi-VN")}. Vui lòng gia hạn để không bị gián đoạn.`}
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    <Card
                        bordered={false}
                        style={{
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            borderRadius: 8,
                        }}
                    >
                        <Table
                            columns={currentSubColumns}
                            dataSource={[currentSubscription]}
                            pagination={false}
                            rowKey="id"
                        />
                    </Card>
                </div>
            )}

            <Divider />

            <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
                Nâng cấp gói dịch vụ
            </Title>

            <Row gutter={[24, 24]}>
                {plans.map((plan) => {
                    const isCurrent = currentSubscription?.plan_id === plan.id;
                    const price = Number(plan.price_monthly);

                    return (
                        <Col xs={24} sm={12} md={8} key={plan.id}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 12,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: isCurrent
                                        ? "2px solid #1890ff"
                                        : "1px solid #f0f0f0",
                                }}
                                title={
                                    <Space>
                                        <span style={{ fontWeight: "bold" }}>
                                            {plan.name}
                                        </span>
                                        {isCurrent && (
                                            <Tag color="blue">Đang dùng</Tag>
                                        )}
                                    </Space>
                                }
                            >
                                <div
                                    style={{
                                        textAlign: "center",
                                        marginBottom: 24,
                                    }}
                                >
                                    <Title
                                        level={3}
                                        style={{ margin: 0, color: "#1890ff" }}
                                    >
                                        {formatVND(price)}
                                    </Title>
                                    <Text type="secondary">/ tháng</Text>
                                </div>

                                <ul
                                    style={{
                                        listStyle: "none",
                                        padding: 0,
                                        margin: "0 0 24px 0",
                                        flexGrow: 1,
                                    }}
                                >
                                    <li style={{ marginBottom: 12 }}>
                                        <CheckCircleOutlined
                                            style={{
                                                color: "#52c41a",
                                                marginRight: 8,
                                            }}
                                        />
                                        Tối đa{" "}
                                        <strong>{plan.max_fields}</strong> sân
                                    </li>
                                    <li style={{ marginBottom: 12 }}>
                                        <CheckCircleOutlined
                                            style={{
                                                color: "#52c41a",
                                                marginRight: 8,
                                            }}
                                        />
                                        Tối đa <strong>{plan.max_staff}</strong>{" "}
                                        nhân viên
                                    </li>
                                </ul>

                                <div style={{ marginBottom: 16 }}>
                                    <Text type="secondary">
                                        Thời gian (tháng):
                                    </Text>
                                    <InputNumber
                                        min={1}
                                        max={36}
                                        value={months}
                                        onChange={(val) => setMonths(val || 1)}
                                        style={{ width: "100%", marginTop: 4 }}
                                    />
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    loading={
                                        loading && selectedPlan?.id === plan.id
                                    }
                                    onClick={() => handleCreateRequest(plan)}
                                    style={{
                                        borderRadius: 8,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Đăng ký ngay
                                </Button>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
}

Register.layout = (page: React.ReactNode) => (
    <App>
        <TenantLayout children={page} />
    </App>
);
