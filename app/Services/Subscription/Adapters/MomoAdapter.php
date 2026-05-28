<?php

namespace App\Services\Subscription\Adapters;

use App\Services\Subscription\PaymentAdapter;
use App\Models\SubscriptionPayment;

class MomoAdapter implements PaymentAdapter
{
    public function createTransaction(SubscriptionPayment $payment): array
    {
        // Dummy implementation for Momo
        $transactionRef = 'MOMO' . str_pad($payment->id, 6, '0', STR_PAD_LEFT);
        $payment->update(['transaction_ref' => $transactionRef]);

        return [
            'success' => true,
            'payment_url' => "https://momo.vn/pay",
            'transaction_ref' => $transactionRef,
            'amount' => $payment->amount,
        ];
    }

    public function processWebhook(array $payload): array
    {
        // Giả lập phân tích webhook đặc thù của Momo
        $description = $payload['message'] ?? $payload['orderInfo'] ?? '';
        $amount = (float) ($payload['amount'] ?? 0);

        if (!preg_match('/MOMO\d+/', $description, $matches)) {
            return [
                'success' => false,
                'message' => 'No matching Momo reference found',
            ];
        }

        $transactionRef = $matches[0];

        // Đóng vai trò là Adapter: Phân tích định dạng dữ liệu đặc thù của Momo
        // rồi ủy quyền thực thi nghiệp vụ kích hoạt cho TenantSubscriptionService
        return app(TenantSubscriptionService::class)->activateSubscription($transactionRef, $amount);
    }
}
