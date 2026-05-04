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

                    $startDate = ($subscription->ends_at && $subscription->ends_at->isFuture())
                        ? $subscription->ends_at
                        : now();

                    $subscription->update([
                        'status' => 'active',
                        'starts_at' => ($subscription->status === 'active') ? $subscription->starts_at : now(),
                        'ends_at' => $startDate->copy()->addMonths($months),
                    ]);
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
