<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPayment;

interface PaymentAdapter
{
    /**
     * Tạo thông tin giao dịch (ví dụ: QR URL, Redirect URL)
     */
    public function createTransaction(SubscriptionPayment $payment): array;

    /**
     * Xử lý dữ liệu từ Webhook của cổng thanh toán
     */
    public function processWebhook(array $payload): array;
}
