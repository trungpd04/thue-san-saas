<?php

namespace App\Services\Webhook;

use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SePayWebhookService
{
    /**
     * Xử lý webhook từ SePay
     */
    public function handle($data)
    {
        $content = $data['content'] ?? '';
        $transferAmount = (float) ($data['transferAmount'] ?? 0);

        // Regex lấy mã giao dịch
        if (preg_match('/TS\d+/', $content, $matches)) {
            $transactionRef = $matches[0];

            $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)
                ->where('status', 'pending')
                ->first();

            if (!$payment) {
                return ['success' => false, 'message' => 'Payment not found'];
            }

            // Kích hoạt ngữ cảnh tenant
            tenancy()->initialize($payment->tenant_id); 

            if ($transferAmount < $payment->amount) {
                Log::error("SePay Webhook: Insufficient amount for Ref: {$transactionRef}");
                return ['success' => false, 'message' => 'Insufficient amount'];
            }

            try {
                DB::transaction(function () use ($payment, $transferAmount) {
                    // 1. Cập nhật Payment
                    $payment->update([
                        'status' => 'success',
                        'paid_at' => now(),
                    ]);

                    // 2. Cập nhật Subscription
                    $subscription = $payment->subscription;
                    $plan = $subscription->plan;

                    $months = ($plan->price_monthly > 0)
                        ? (int)round($payment->amount / $plan->price_monthly)
                        : 1;

                    // Tìm gói cũ đang active để lấy ngày hết hạn (nếu muốn nối tiếp) và xóa sau đó
                    $oldActiveSubscription = \App\Models\Subscription::where('tenant_id', $payment->tenant_id)
                        ->where('id', '!=', $subscription->id)
                        ->whereIn('status', ['active', 'trial'])
                        ->first();

                    $startDate = ($oldActiveSubscription && $oldActiveSubscription->ends_at && $oldActiveSubscription->ends_at->isFuture())
                        ? $oldActiveSubscription->ends_at
                        : now();

                    // Kích hoạt gói mới
                    $subscription->update([
                        'status' => 'active',
                        'starts_at' => now(), // Ngày bắt đầu thực tế của bản ghi này
                        'ends_at' => $startDate->copy()->addMonths($months),
                    ]);

                    // Xóa gói cũ sau khi gói mới đã active (theo yêu cầu)
                    if ($oldActiveSubscription) {
                        $oldActiveSubscription->payments()->delete();
                        $oldActiveSubscription->delete();
                    }
                });

                Log::info("SePay Webhook: Successfully processed Ref: {$transactionRef}");
                return ['success' => true];
            } catch (\Exception $e) {
                Log::error("SePay Webhook ERROR: " . $e->getMessage());
                throw $e;
            }
        }

        return ['success' => false, 'message' => 'No ref found'];
    }
}
