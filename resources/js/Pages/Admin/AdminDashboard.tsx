import { Typography } from "antd";
import AdminLayout from "../../Layout/Admin/AdminLayout";

export default function Dashboard() {
    return (
          <Typography.Title level={2}>Dashboard</Typography.Title>
    );
}

Dashboard.layout = (page: React.ReactNode) => <AdminLayout children={page}/>;
