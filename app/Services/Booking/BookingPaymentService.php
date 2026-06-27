<?php

namespace App\Services\Booking;

use App\Models\Tenant\Booking;
use App\Models\Tenant\Payment;
use App\Services\Booking\Adapters\SepayBankHubBookingAdapter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingPaymentService
{
    protected BookingPaymentManager $paymentManager;

    public function __construct(BookingPaymentManager $paymentManager)
    {
        $this->paymentManager = $paymentManager;
    }

    /**
     * Tạo thông tin thanh toán cho một hoặc nhiều booking
     *
     * @param Collection<int, Booking> $bookings
     * @param string $method
     * @param array $context
     * @return array
     */
    public function createPayment(Collection $bookings, string $method = 'sepay_bankhub', array $context = []): array
    {
        $adapter = $this->resolveAdapter($method);

        return $this->paymentManager
            ->setAdapter($adapter)
            ->processPayment($bookings, $context);
    }

    /**
     * Xử lý webhook chung (delegate từ Controller xuống)
     *
     * @param array $payload
     * @param string $method
     * @return array
     */
    public function handleWebhook(array $payload, string $method = 'sepay_bankhub'): array
    {
        $adapter = $this->resolveAdapter($method);

        return $this->paymentManager
            ->setAdapter($adapter)
            ->handleWebhook($payload);
    }

    /**
     * Kích hoạt booking sau khi thanh toán thành công
     * (Domain logic dùng chung cho tất cả các payment adapters)
     *
     * @param int $bookingId
     * @param float $transferAmount
     * @return array
     */
    public function activateBookingPayment(int $bookingId, float $transferAmount): array
    {
        Log::info("BookingPayment: activateBookingPayment called", [
            'booking_id' => $bookingId,
            'amount' => $transferAmount,
        ]);

        // Tìm booking gốc (withoutGlobalScopes vì webhook không có tenant context)
        $booking = Booking::withoutGlobalScopes()->where('id', $bookingId)->first();

        if (!$booking) {
            return [
                'handled' => true,
                'success' => false,
                'message' => 'Booking not found',
            ];
        }

        if (in_array($booking->status, ['paid', 'confirmed'], true)) {
            return [
                'handled' => true,
                'success' => true,
                'message' => 'Booking already paid',
            ];
        }

        if (!in_array($booking->status, ['locked_pending', 'pending'], true)) {
            return [
                'handled' => true,
                'success' => false,
                'message' => 'Booking is not payable',
            ];
        }

        // Switch sang tenant DB
        tenancy()->initialize($booking->tenant_id);

        // Tìm các booking liên quan (cùng khách, cùng thời điểm khóa)
        $relatedQuery = Booking::withoutGlobalScopes()
            ->where('tenant_id', $booking->tenant_id)
            ->where('customer_id', $booking->customer_id)
            ->whereIn('status', ['locked_pending', 'pending']);

        if ($booking->locked_at) {
            $relatedQuery
                ->where('locked_at', '>=', $booking->locked_at->copy()->subSecond())
                ->where('locked_at', '<=', $booking->locked_at->copy()->addSecond());
        } else {
            $relatedQuery->where('id', $booking->id);
        }

        $relatedBookings = $relatedQuery->get();
        $totalRequired = (float) $relatedBookings->sum('total_price');

        Log::info('BookingPayment: Related bookings found', [
            'booking_id' => $bookingId,
            'related_count' => $relatedBookings->count(),
            'required' => $totalRequired,
            'received' => $transferAmount,
        ]);

        if ($transferAmount < $totalRequired) {
            return [
                'handled' => true,
                'success' => false,
                'message' => 'Insufficient amount',
            ];
        }

        try {
            DB::transaction(function () use ($relatedBookings, $transferAmount): void {
                foreach ($relatedBookings as $relatedBooking) {
                    $relatedBooking->update([
                        'status' => 'paid',
                        'note' => trim(
                            ($relatedBooking->note ? $relatedBooking->note . ' - ' : '')
                            . 'Da thanh toan luc ' . now()->format('H:i d/m/Y')
                        ),
                    ]);

                    Payment::firstOrCreate(
                        [
                            'booking_id' => $relatedBooking->id,
                            'payment_method' => 'sepay_bankhub',
                            'status' => 'success',
                        ],
                        [
                            'tenant_id' => $relatedBooking->tenant_id,
                            'customer_id' => $relatedBooking->customer_id,
                            'amount' => $relatedBooking->total_price,
                            'type' => 'banking',
                            'paid_at' => now(),
                            'note' => 'Paid via webhook',
                        ]
                    );
                }
            });

            Log::info("BookingPayment: Successfully processed booking #{$relatedBookings->pluck('id')->join(',')}");

            return [
                'handled' => true,
                'success' => true,
                'message' => 'Booking payment processed',
            ];
        } catch (\Exception $e) {
            Log::error("BookingPayment ERROR: " . $e->getMessage(), [
                'booking_id' => $bookingId,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'handled' => true,
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Resolve adapter dựa trên tên phương thức thanh toán
     */
    protected function resolveAdapter(string $method): BookingPaymentAdapter
    {
        return match ($method) {
            // Thêm adapter mới ở đây trong tương lai, ví dụ:
            // 'momo' => app(MomoBookingAdapter::class),
            default => app(SepayBankHubBookingAdapter::class),
        };
    }
}
