<?php

namespace App\Services\Subscription\Strategies;

use App\Services\Subscription\PaymentStrategy;
use App\Models\SubscriptionPayment;

class MomoStrategy implements PaymentStrategy
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
        // Dummy implementation for Momo Webhook
        return [
            'success' => true,
            'message' => 'Momo webhook processed (dummy)'
        ];
    }
}
