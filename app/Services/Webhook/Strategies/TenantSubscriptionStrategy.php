<?php

namespace App\Services\Webhook\Strategies;

use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Subscription;

class TenantSubscriptionStrategy implements SePayStrategyInterface
{
    public function canHandle(string $content): bool
    {
        // Nhận diện mã gia hạn gói (VD: TS12345)
        return preg_match('/TS\d+/', $content) === 1;
    }

    public function handle(array $data): array
    {
        $content = $data['content'] ?? '';
        $transferAmount = (float) ($data['transferAmount'] ?? 0);

        if (!preg_match('/TS\d+/', $content, $matches)) {
            return ['success' => false, 'message' => 'No ref found'];
        }

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
            DB::transaction(function () use ($payment) {
                // 1. Cập nhật Payment
                $payment->update([
                    'status' => 'success',
                    'paid_at' => now(),
                ]);

                // 2. Cập nhật Subscription
                $subscription = $payment->subscription;

                // Tìm gói cũ đang active
                $oldActiveSubscription = Subscription::where('tenant_id', $payment->tenant_id)
                    ->where('id', '!=', $subscription->id)
                    ->whereIn('status', ['active', 'trial'])
                    ->first();

                // Kích hoạt gói mới
                $subscription->update([
                    'status' => 'active',
                    'starts_at' => $payment->billing_period_start, 
                    'ends_at' => $payment->billing_period_end, 
                ]);
                
                if ($oldActiveSubscription) {
                    $oldActiveSubscription->update([
                        'status' => 'expired',
                        'ends_at' => now(), 
                    ]);
                }
            });

            Log::info("SePay Webhook: Successfully processed Ref: {$transactionRef}");
            return ['success' => true];
        } catch (\Exception $e) {
            Log::error("SePay Webhook ERROR: " . $e->getMessage());
            throw $e;
        }
    }
}
