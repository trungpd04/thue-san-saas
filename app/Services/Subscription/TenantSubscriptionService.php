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

            // Nếu đang có subscription ở trạng thái pending, xóa nó và các payment liên quan
            // Để người dùng có thể tạo yêu cầu mới (ví dụ chọn gói khác hoặc thời gian khác)
            $existingPending = Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'pending')
                ->first();

            if ($existingPending) {
                $existingPending->payments()->delete();
                $existingPending->delete();
            }

            // Tạo MỚI Subscription (trạng thái chờ)
            // Không dùng updateOrCreate để tránh ghi đè lên gói đang Active
            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'pending',
            ]);

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

    /**
     * Dọn dẹp các yêu cầu thanh toán đã hết hạn (5 phút)
     */
    public function cleanupExpiredPayments($tenantId)
    {
        $expiredPayments = SubscriptionPayment::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(5))
            ->get();

        foreach ($expiredPayments as $payment) {
            $this->cancelPendingPayment($payment->transaction_ref);
        }
    }

    public function cancelPendingPayment($transactionRef)
    {
        return DB::transaction(function () use ($transactionRef) {
            $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)
                ->where('status', 'pending')
                ->first();

            if ($payment) {
                $subscription = $payment->subscription;
                $payment->delete();

                // Nếu subscription cũng đang ở trạng thái pending (chưa được kích hoạt bao giờ)
                // và không còn khoản thanh toán nào khác liên quan thì xóa để dọn dẹp
                if ($subscription && $subscription->status === 'pending') {
                    if ($subscription->payments()->count() === 0) {
                        $subscription->delete();
                    }
                }
                return true;
            }
            return false;
        });
    }
}
