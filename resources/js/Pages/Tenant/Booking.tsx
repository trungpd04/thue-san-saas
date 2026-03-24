import { Typography } from "antd";
import TenantLayout from "../../Layout/Tenant/TenantLayout";

export default function Booking() {
    return (
        <Typography.Title level={2}>Đặt sân</Typography.Title>
    );
}

Booking.layout = (page: React.ReactNode) => <TenantLayout children={page}/>;