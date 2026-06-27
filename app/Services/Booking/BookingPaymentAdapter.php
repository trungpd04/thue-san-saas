<?php

namespace App\Services\Booking;

use App\Models\Tenant\Booking;
use Illuminate\Support\Collection;

interface BookingPaymentAdapter
{
    /**
     * Tạo thông tin thanh toán cho một hoặc nhiều booking (QR code, redirect URL, v.v.)
     *
     * @param Collection<int, Booking> $bookings
     * @param array $context Thông tin bổ sung (tenant, bank account, v.v.)
     * @return array
     */
    public function createTransaction(Collection $bookings, array $context = []): array;

    /**
     * Xử lý dữ liệu từ Webhook của cổng thanh toán
     *
     * @param array $payload
     * @return array
     */
    public function processWebhook(array $payload): array;
}
