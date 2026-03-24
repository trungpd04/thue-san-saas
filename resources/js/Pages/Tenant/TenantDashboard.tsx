import { Typography } from "antd";
import TenantLayout from "../../Layout/Tenant/TenantLayout";

export default function TenantDashboard() {
    return (
        <Typography.Title level={2}>Tổng quan</Typography.Title>
    );
}

TenantDashboard.layout = (page: React.ReactNode) => <TenantLayout children={page}/>;