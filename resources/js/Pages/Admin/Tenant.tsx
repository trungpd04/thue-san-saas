import { Typography } from "antd";
import AdminLayout from "../../Layout/Admin/AdminLayout";

export default function TenantMangement() {
    return (
        <Typography.Title level={2}>Tenant Management</Typography.Title>
    );
}

TenantMangement.layout = (page: React.ReactNode) => <AdminLayout children={page}/>;