<?php

namespace App\Services\Booking;

use Illuminate\Support\Collection;
use App\Models\Tenant\Booking;
use Exception;

class BookingPaymentManager
{
    protected ?BookingPaymentAdapter $adapter = null;

    /**
     * Thiết lập adapter thanh toán cho booking
     */
    public function setAdapter(BookingPaymentAdapter $adapter): self
    {
        $this->adapter = $adapter;
        return $this;
    }

    /**
     * Tạo thông tin thanh toán thông qua adapter đã chọn
     *
     * @param Collection<int, Booking> $bookings
     * @param array $context
     * @return array
     */
    public function processPayment(Collection $bookings, array $context = []): array
    {
        if (!$this->adapter) {
            throw new Exception("Booking payment adapter not set.");
        }

        return $this->adapter->createTransaction($bookings, $context);
    }

    /**
     * Xử lý webhook thông qua adapter đã chọn
     */
    public function handleWebhook(array $payload): array
    {
        if (!$this->adapter) {
            throw new Exception("Booking payment adapter not set.");
        }

        return $this->adapter->processWebhook($payload);
    }
}
