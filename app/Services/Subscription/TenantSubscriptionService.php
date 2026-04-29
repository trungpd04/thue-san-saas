<?php

namespace App\Services\Subscription;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantSubscriptionService
{
    /**
     * Xử lý tạo yêu cầu đăng ký gói và trả về thông tin thanh toán
     */
    public function register($tenant, $planId, $months)
    {
        $plan = Plan::findOrFail($planId);
        $months = (int) $months;

        return DB::connection('mysql')->transaction(function () use ($plan, $tenant, $months) {
            $totalAmount = $plan->price_monthly * $months;

            // Cập nhật hoặc tạo mới Subscription (trạng thái chờ)
            $subscription = Subscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'pending', 
                ]
            );

            // Lưu vào bảng subscription_payments
            $payment = SubscriptionPayment::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'amount' => $totalAmount,
                'payment_method' => 'sepay_transfer',
                'status' => 'pending',
                'note' => "Thanh toán gói {$plan->name} cho {$months} tháng",
                'billing_period_start' => Carbon::now(),
                'billing_period_end' => Carbon::now()->addMonths($months),
            ]);

            $transactionRef = 'TS' . str_pad($payment->id, 6, '0', STR_PAD_LEFT);
            $payment->update(['transaction_ref' => $transactionRef]);

            // Tạo QR SePay
            $bankAcc = config('services.sepay.bank_account');
            $bankId = config('services.sepay.bank_id');
            $payUrl = "https://qr.sepay.vn/img?acc={$bankAcc}&bank={$bankId}&amount={$totalAmount}&des={$transactionRef}&template=compact";

            return [
                'success' => true,
                'payment_url' => $payUrl,
                'transaction_ref' => $transactionRef,
                'amount' => $totalAmount,
                'message' => 'Yêu cầu thanh toán đã được tạo.'
            ];
        });
    }

    public function checkStatus($ref)
    {
        $payment = SubscriptionPayment::where('transaction_ref', $ref)->first();
        return $payment ? $payment->status : null;
    }
}
