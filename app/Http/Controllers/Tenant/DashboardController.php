<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\Payment;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $currentYear = $now->year;
        $lastYear = $currentYear - 1;
        
        $tenant = tenant();
        $tenantId = $tenant->id;

        // 1. Lấy thông tin gói cước
        $currentSubscription = $tenant->activeSubscription()->with('plan')->first();
        $planName = ($currentSubscription && $currentSubscription->plan) 
            ? $currentSubscription->plan->name . ($currentSubscription->status === 'trial' ? ' (Dùng thử)' : '')
            : 'Chưa đăng ký gói';

        // 2. Thống kê tổng quan THÁNG HIỆN TẠI
        $totalFields = Field::where('tenant_id', $tenantId)->count();
        $bookingsThisMonth = Booking::where('tenant_id', $tenantId)
            ->whereMonth('booking_date', $now->month)
            ->whereYear('booking_date', $currentYear)
            ->count();
        $revenueThisMonth = Payment::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereMonth('paid_at', $now->month)
            ->whereYear('paid_at', $currentYear)
            ->sum('amount');

        // 3.1 Dữ liệu 12 tháng của NĂM HIỆN TẠI
        $chartDataCurrentYear = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyRevenue = Payment::where('tenant_id', $tenantId)
                ->where('status', 'paid')
                ->whereMonth('paid_at', $m)
                ->whereYear('paid_at', $currentYear)
                ->sum('amount');
            $monthlyBookings = Booking::where('tenant_id', $tenantId)
                ->whereMonth('booking_date', $m)
                ->whereYear('booking_date', $currentYear)
                ->count();

            $chartDataCurrentYear[] = [
                'name' => 'Tháng ' . $m,
                'doanh_thu' => (float) $monthlyRevenue,
                'lich_dat' => $monthlyBookings
            ];
        }

        // 3.2 Dữ liệu 12 tháng của NĂM TRƯỚC
        $chartDataLastYear = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyRevenue = Payment::where('tenant_id', $tenantId)
                ->where('status', 'paid')
                ->whereMonth('paid_at', $m)
                ->whereYear('paid_at', $lastYear)
                ->sum('amount');
            $monthlyBookings = Booking::where('tenant_id', $tenantId)
                ->whereMonth('booking_date', $m)
                ->whereYear('booking_date', $lastYear)
                ->count();

            $chartDataLastYear[] = [
                'name' => 'Tháng ' . $m,
                'doanh_thu' => (float) $monthlyRevenue,
                'lich_dat' => $monthlyBookings
            ];
        }

        return Inertia::render('Tenant/TenantDashboard', [
            'stats' => [
                'total_fields' => $totalFields,
                'total_bookings' => $bookingsThisMonth,
                'current_plan' => $planName,
                'revenue' => $revenueThisMonth,
                'current_year' => $currentYear,
                'last_year' => $lastYear,
            ],
            'chartDataCurrentYear' => $chartDataCurrentYear,
            'chartDataLastYear' => $chartDataLastYear
        ]);
    }
}