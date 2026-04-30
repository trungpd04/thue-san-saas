<?php

namespace App\Services\Subscription;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\DB;

class AdminSubscriptionService
{
    /**
     * Gán gói cước cho Tenant
     */
    public function assignPlan($tenant, $planId, $months)
    {
        $plan = Plan::findOrFail($planId);
        $months = (int) $months;

        return DB::transaction(function () use ($tenant, $plan, $months) {
            // Đưa các gói cũ về trạng thái expired
            Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->update(['status' => 'expired', 'ends_at' => now()]);

            // Tạo gói đăng ký mới
            return Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addMonths($months),
            ]);
        });
    }

    /**
     * Admin duyệt thanh toán thủ công
     */
    public function approvePayment($paymentId)
    {
        $payment = SubscriptionPayment::findOrFail($paymentId);

        if ($payment->status === 'success') {
            throw new \Exception('Giao dịch này đã được xử lý trước đó.');
        }

        return DB::transaction(function () use ($payment) {
            // 1. Cập nhật trạng thái thanh toán
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'note' => $payment->note . " | Admin xác nhận lúc: " . now(),
            ]);

            // 2. Kích hoạt Subscription tương ứng
            $subscription = $payment->subscription;
            $subscription->update([
                'status' => 'active',
            ]);

            return $payment;
        });
    }
}
