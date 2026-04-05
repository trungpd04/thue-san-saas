import React from 'react';
import { Typography } from 'antd';
import TenantLayout from '../../Layout/Tenant/TenantLayout';

export default function CustomerManagement() {
    return (
        <Typography.Title level={2}>Khách hàng</Typography.Title>
    );
}

CustomerManagement.layout = (page: React.ReactNode) => <TenantLayout children={page} />;
