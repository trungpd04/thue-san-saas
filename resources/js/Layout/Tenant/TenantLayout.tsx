import React, { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button, Layout, Modal, Typography } from 'antd';
import TenantSidebar from '../../Components/Tenant/TenantSidebar';
import TenantHeader from '../../Components/Tenant/TenantHeader';

const { Content } = Layout;

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const { props } = usePage<any>();
    const freePlanLoginPopup = props.flash?.free_plan_login_popup;
    const tenantSlug = props.tenancy?.tenant?.slug;
    const tenantBasePath = tenantSlug ? `/tenant/${tenantSlug}` : '/tenant';
    const dismissedFreePlanPopup = useRef(false);
    const [isFreePlanModalOpen, setIsFreePlanModalOpen] = useState(Boolean(freePlanLoginPopup));

    useEffect(() => {
        if (freePlanLoginPopup && !dismissedFreePlanPopup.current) {
            setIsFreePlanModalOpen(true);
        }
    }, [freePlanLoginPopup]);

    const closeFreePlanModal = () => {
        dismissedFreePlanPopup.current = true;
        setIsFreePlanModalOpen(false);
    };

    const goToSubscriptionRegister = () => {
        closeFreePlanModal();
        router.visit(`${tenantBasePath}/subscription/register`);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <TenantSidebar collapsed={collapsed} />

            <Layout style={{ marginInlineStart: collapsed ? 80 : 240, transition: 'margin 0.2s' }}>
                <TenantHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

                <Content style={{
                    margin: 24,
                    padding: 24,
                    background: '#fff',
                    borderRadius: 8,
                    minHeight: 'calc(100vh - 64px - 48px)',
                    boxShadow: '0 1px 4px rgba(0,21,41,0.05)',
                }}>
                    {children}
                </Content>
            </Layout>

            <Modal
                title="Bạn đang dùng gói miễn phí"
                open={isFreePlanModalOpen}
                onCancel={closeFreePlanModal}
                footer={[
                    <Button key="close" onClick={closeFreePlanModal}>
                        Để sau
                    </Button>,
                    <Button key="upgrade" type="primary" onClick={goToSubscriptionRegister}>
                        Nâng cấp gói ngay
                    </Button>,
                ]}
            >
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                    Tài khoản của bạn hiện vẫn đang sử dụng gói miễn phí. Hãy nâng cấp để mở rộng hạn mức sân, nhân viên và sử dụng đầy đủ tính năng.
                </Typography.Paragraph>
            </Modal>
        </Layout>
    );
}
