import TenantLayout from "../../Layout/Tenant/TenantLayout";
import { Typography } from "antd";

export default function Sport() {
    return (
        <Typography.Title level={2}>Sân</Typography.Title>
    );
}

Sport.layout = (page: React.ReactNode) => <TenantLayout children={page}/>;