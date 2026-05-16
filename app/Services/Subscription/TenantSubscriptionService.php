<?php

namespace App\Services\Subscription;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Services\Subscription\Adapters\MomoAdapter;
use App\Services\Subscription\Adapters\SepayAdapter;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantSubscriptionService
{
    protected $paymentManager;

    public function __construct(PaymentManager $paymentManager)
    {
        $this->paymentManager = $paymentManager;
    }

    /**
     * Xử lý tạo yêu cầu đăng ký gói và trả về thông tin thanh toán
     */
    public function register($tenant, $planId, $months, $method = 'sepay')
    {
        $plan = Plan::findOrFail($planId);
        $months = (int) $months;

        return DB::connection('mysql')->transaction(function () use ($plan, $tenant, $months, $method) {
            $hasHistory = Subscription::where('tenant_id', $tenant->id)->exists();
            if ($plan->price_monthly == 0 && $hasHistory) {
                throw new \Exception("Gói dùng thử này chỉ dành cho tài khoản đăng ký lần đầu.");
            }

            // 1. Xác định gói hiện tại và ngày hết hạn thực tế (bao gồm cả Trial)
            $activeSub = Subscription::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'trial'])
                ->first();

            $currentEndDate = now();
            if ($activeSub) {
                // Ưu tiên ends_at, nếu không có thì lấy trial_ends_at
                $currentEndDate = $activeSub->ends_at ?: $activeSub->trial_ends_at ?: now();
            }

            // 2. Tính toán giá và khấu trừ (Proration)
            $newPlanTotal = $plan->price_monthly * $months;
            $discountAmount = 0;
            $isReplacement = false;

            // Chỉ khấu trừ nếu đổi sang gói KHÁC hoàn toàn (Upgrade)
            // và gói cũ còn hạn
            if ($activeSub && $activeSub->plan_id != $plan->id && $currentEndDate->isAfter(now())) {
                $remainingDays = (int) now()->diffInDays($currentEndDate);
                
                if ($remainingDays > 0) {
                    $oldPlanPrice = $activeSub->plan->price_monthly;
                    // Tính tiền thừa dựa trên số ngày còn lại (giả định 1 tháng có 30 ngày)
                    // Tiền thừa = (Số ngày dư * (Giá gói cũ / 30)) * 70%
                    $discountAmount = ($remainingDays * ($oldPlanPrice / 30)) * 0.7;
                    $isReplacement = true; // Đánh dấu là thay thế gói cũ ngay lập tức
                }
            }

            // 3. Xác định ngày bắt đầu và kết thúc
            if ($isReplacement) {
                $startDate = now();
            } else {
                $startDate = $currentEndDate->isAfter(now()) ? $currentEndDate : now();
            }

            $billingEnd = $startDate->copy()->addMonths($months);
            $totalAmount = max(0, $newPlanTotal - $discountAmount);

            // 4. KIỂM TRA NẾU SỐ TIỀN BẰNG 0
            if ($totalAmount <= 0) {
                if ($activeSub) {
                    $activeSub->update(['status' => 'expired', 'ends_at' => now()]);
                }

                $subscription = Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => $billingEnd
                ]);

                SubscriptionPayment::create([
                    'tenant_id' => $tenant->id,
                    'subscription_id' => $subscription->id,
                    'amount' => 0,
                    'payment_method' => 'internal_credit',
                    'status' => 'success',
                    'paid_at' => now(),
                    'note' => "Đổi gói miễn phí (Khấu trừ từ gói cũ cao hơn hoặc bằng giá gói mới)",
                    'billing_period_start' => $startDate,
                    'billing_period_end' => $billingEnd,
                ]);

                return [
                    'success' => true,
                    'is_free' => true,
                    'tenant_slug' => $tenant->slug,
                    'message' => 'Gói dịch vụ đã được kích hoạt thành công (miễn phí).'
                ];
            }

            // Xử lý Subscription pending cũ
            $existingPending = Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'pending')
                ->first();

            if ($existingPending) {
                $existingPending->payments()->delete();
                $existingPending->delete();
            }

            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'pending',
            ]);

            $payment = SubscriptionPayment::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'amount' => $totalAmount,
                'payment_method' => "{$method}_transfer",
                'status' => 'pending',
                'note' => "Thanh toán gói {$plan->name} cho {$months} tháng",
                'billing_period_start' => $startDate,
                'billing_period_end' => $billingEnd,
            ]);

            // Sử dụng PaymentManager để xử lý thanh toán
            $adapter = match ($method) {
                'momo' => app(MomoAdapter::class),
                default => app(SepayAdapter::class),
            };

            $paymentResult = $this->paymentManager
                ->setAdapter($adapter)
                ->processPayment($payment);

            return array_merge([
                'success' => true,
                'message' => 'Yêu cầu thanh toán đã được tạo.'
            ], $paymentResult);
        });
    }

    public function checkStatus($ref)
    {
        $payment = SubscriptionPayment::where('transaction_ref', $ref)->first();
        return $payment ? $payment->status : null;
    }

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
