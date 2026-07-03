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
        // Trạng thái thanh toán thành công trong hệ thống có thể là 'paid' hoặc 'success'
        $totalRevenue = SubscriptionPayment::whereIn('status', ['paid', 'success'])->sum('amount');

        return [
            'total_tenants' => $totalTenants,
            'total_revenue' => (float) $totalRevenue,
        ];
    }
}