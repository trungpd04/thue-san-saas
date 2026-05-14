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
import { formatDate } from '@/utils/date';

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
    activeSubscription,
    pendingSubscription,
    currentSubscription, // Vẫn nhận để tương thích ngược nếu cần
}: {
    plans: Plan[];
    activeSubscription: any;
    pendingSubscription: any;
    currentSubscription: any;
}) {
    const { tenancy } = usePage<RegisterPageProps>().props;
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [months, setMonths] = useState(1);
    const [loading, setLoading] = useState(false);
    const tenantBasePath = tenancy?.tenant?.slug
        ? `/tenant/${tenancy.tenant.slug}`
        : "/tenant";

    // Danh sách các subscription để hiển thị trong table
    const displaySubscriptions = [activeSubscription, pendingSubscription].filter(Boolean);

    // tính ngày hết hạn báo trước 7 ngày (dựa trên gói active)
    const endsAt = activeSubscription?.ends_at
        ? new Date(activeSubscription.ends_at)
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
                <Text strong style={{ color: "#1890ff" }}>
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
            render: (status: string) => {
                const statusMap: Record<
                    string,
                    { color: string; label: string }
                > = {
                    active: { color: "green", label: "Đang hoạt động" },
                    pending: { color: "orange", label: "Chờ xử lý" },
                    trial: { color: "purple", label: "Dùng thử" },
                    expired: { color: "red", label: "Hết hạn" },
                    cancelled: { color: "default", label: "Đã hủy" },
                };

                const config = statusMap[status] || {
                    color: "default",
                    label: status,
                };

                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: any) => {
                if (record.status === "pending") {
                    const pendingPayment = record.payments?.[0];
                    if (pendingPayment) {
                        return (
                            <Button
                                type="primary"
                                size="small"
                                icon={<CreditCardOutlined />}
                                onClick={() => {
                                    window.location.href = `${tenantBasePath}/subscription/sepay-payment?ref=${pendingPayment.transaction_ref}`;
                                }}
                            >
                                Tiếp tục thanh toán
                            </Button>
                        );
                    }
                }
                return null;
            },
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
                // window.location.href = `${tenantBasePath}/subscription/sepay-payment?ref=${response.data.transaction_ref}`;
                 // Trường hợp 1: Nếu là gói miễn phí (sau khi khấu trừ tiền âm/bằng 0)
                if (response.data.is_free) {
                    message.success(response.data.message || "Gói dịch vụ đã được kích hoạt!");
                    // Chuyển hướng về Dashboard (Lưu ý phải truyền slug tenant vào route)
                    // Nếu dùng window.location.href:
                    window.location.href = `/tenant/${tenancy?.tenant?.slug}/subscription/status`;
                    return;
                }

                // Trường hợp 2: Nếu cần thanh toán (số tiền > 0)
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
            {displaySubscriptions.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                    <Title level={4}>Thông tin gói hiện tại</Title>
                    {isExpiringSoon && (
                        <Alert
                            message="Cảnh báo hết hạn"
                            description={`Gói dịch vụ của bạn sẽ hết hạn vào ngày ${new Date(activeSubscription.ends_at).toLocaleDateString("vi-VN")}. Vui lòng gia hạn để không bị gián đoạn.`}
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
                            dataSource={displaySubscriptions}
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
                    const isActive = activeSubscription?.plan_id === plan.id;
                    const isPending = pendingSubscription?.plan_id === plan.id;
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
                                    border: isActive
                                        ? "2px solid #1890ff"
                                        : isPending
                                            ? "2px dashed #orange"
                                            : "1px solid #f0f0f0",
                                }}
                                title={
                                    <Space>
                                        <span style={{ fontWeight: "bold" }}>
                                            {plan.name}
                                        </span>
                                        {isActive && (
                                            <Tag color="blue">Đang dùng</Tag>
                                        )}
                                        {isPending && (
                                            <Tag color="orange">Đang chờ xử lý</Tag>
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
                                        readOnly={plan.id === 4}
                                        min={1}
                                        max={36}
                                        value={months}
                                        onChange={(val) => setMonths(val || 1)}
                                        style={{ width: "100%", marginTop: 4 }}
                                    />
                                </div>

                                <Button
                                    disabled={isActive}
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
