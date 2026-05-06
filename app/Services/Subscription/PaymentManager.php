<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPayment;
use Exception;

class PaymentManager
{
    protected ?PaymentStrategy $strategy = null;

    /**
     * Thiết lập strategy thanh toán
     */
    public function setStrategy(PaymentStrategy $strategy): self
    {
        $this->strategy = $strategy;
        return $this;
    }

    /**
     * Xử lý tạo thanh toán thông qua strategy đã chọn
     */
    public function processPayment(SubscriptionPayment $payment): array
    {
        if (!$this->strategy) {
            throw new Exception("Payment strategy not set.");
        }

        return $this->strategy->createTransaction($payment);
    }

    /**
     * Xử lý webhook thông qua strategy đã chọn
     */
    public function handleWebhook(array $payload): array
    {
        if (!$this->strategy) {
            throw new Exception("Payment strategy not set.");
        }

        return $this->strategy->processWebhook($payload);
    }
}
