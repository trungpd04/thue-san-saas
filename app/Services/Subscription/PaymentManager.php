<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPayment;
use Exception;

class PaymentManager
{
    protected ?PaymentAdapter $adapter = null;

    /**
     * Thiết lập adapter thanh toán
     */
    public function setAdapter(PaymentAdapter $adapter): self
    {
        $this->adapter = $adapter;
        return $this;
    }

    /**
     * Xử lý tạo thanh toán thông qua strategy đã chọn
     */
    public function processPayment(SubscriptionPayment $payment): array
    {
        if (!$this->adapter) {
            throw new Exception("Payment adapter not set.");
        }

        return $this->adapter->createTransaction($payment);
    }

    /**
     * Xử lý webhook thông qua strategy đã chọn
     */
    public function handleWebhook(array $payload): array
    {
        if (!$this->adapter) {
            throw new Exception("Payment adapter not set.");
        }

        return $this->adapter->processWebhook($payload);
    }
}
