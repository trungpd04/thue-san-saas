<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\Payment;
use Carbon\Carbon;

class DashboardService
{
    protected $tenantId;
    protected $now;
    protected $currentYear;
    protected $lastYear;

    public function __construct()
    {
        $this->now = Carbon::now();
        $this->currentYear = $this->now->year;
        $this->lastYear = $this->currentYear - 1;
    }

    public function setTenantId(string $tenantId): self
    {
        $this->tenantId = $tenantId;
        return $this;
    }

    public function getStats(): array
    {
        return [
            'total_fields' => Field::where('tenant_id', $this->tenantId)->count(),
            'total_bookings' => Booking::where('tenant_id', $this->tenantId)
                ->whereMonth('booking_date', $this->now->month)
                ->whereYear('booking_date', $this->currentYear)
                ->count(),
            'revenue' => Payment::where('tenant_id', $this->tenantId)
                ->where('status', 'success')
                ->whereMonth('paid_at', $this->now->month)
                ->whereYear('paid_at', $this->currentYear)
                ->sum('amount'),
            'current_year' => $this->currentYear,
            'last_year' => $this->lastYear,
        ];
    }

    public function getChartDataForYear(int $year): array
    {
        $data = [];
        for ($month = 1; $month <= 12; $month++) {
            $revenue = Payment::where('tenant_id', $this->tenantId)
                ->where('status', 'success')
                ->whereMonth('paid_at', $month)
                ->whereYear('paid_at', $year)
                ->sum('amount');

            $bookings = Booking::where('tenant_id', $this->tenantId)
                ->whereMonth('booking_date', $month)
                ->whereYear('booking_date', $year)
                ->count();

            $data[] = [
                'name' => 'Tháng ' . $month,
                'doanh_thu' => (float) $revenue,
                'lich_dat' => $bookings,
            ];
        }
        return $data;
    }

    public function getChartDataForMonth(int $year, int $month): array
    {
        $data = [];
        $daysInMonth = Carbon::create($year, $month)->daysInMonth;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $revenue = Payment::where('tenant_id', $this->tenantId)
                ->where('status', 'success')
                ->whereDate('paid_at', Carbon::create($year, $month, $day)->format('Y-m-d'))
                ->sum('amount');

            $bookings = Booking::where('tenant_id', $this->tenantId)
                ->whereDate('booking_date', Carbon::create($year, $month, $day)->format('Y-m-d'))
                ->count();

            $data[] = [
                'name' => sprintf('%02d/%02d/%04d', $day, $month, $year),
                'doanh_thu' => (float) $revenue,
                'lich_dat' => $bookings,
            ];
        }
        return $data;
    }

    public function getPlanName($tenant): string
    {
        $subscription = $tenant->activeSubscription()->with('plan')->first();
        if ($subscription && $subscription->plan) {
            return $subscription->plan->name . ($subscription->status === 'trial' ? ' (Dùng thử)' : '');
        }
        return 'Chưa đăng ký gói';
    }
}