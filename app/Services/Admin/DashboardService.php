<?php

namespace App\Services\Admin;

use App\Models\Tenant;
use App\Models\SubscriptionPayment;

class DashboardService
{
    public function getGeneralStats(): array
    {
        // Đếm tổng số Tenant (chủ sân)
        $totalTenants = Tenant::count();

        // Tính tổng doanh thu từ bảng thanh toán gói dịch vụ
        // Giả sử trạng thái thanh toán thành công của bạn là 'paid'
        $totalRevenue = SubscriptionPayment::where('status', 'paid')->sum('amount');

        return [
            'total_tenants' => $totalTenants,
            'total_revenue' => (float) $totalRevenue,
        ];
    }
}