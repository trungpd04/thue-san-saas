<?php

namespace App\Services\Webhook;

use App\Models\Tenant\Booking;
use App\Models\Tenant\Payment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SePayBookingService
{
    /**
     * Xử lý webhook thanh toán đặt sân từ SePay
     */
    public function handle($data)
    {
        $content = $data['content'] ?? '';
        $transferAmount = (float) ($data['transferAmount'] ?? 0);

        // Regex lấy mã đặt sân (BK + ID), chấp nhận cả trường hợp có khoảng trắng ở giữa
        if (preg_match('/BK\s*(\d+)/i', $content, $matches)) {
            $bookingId = $matches[1];

            // Tìm booking xuyên qua bộ lọc tenant (do đang ở context webhook trung tâm)
            $booking = Booking::withoutGlobalScopes()
                ->where('id', $bookingId)
                ->whereIn('status', ['locked_pending', 'pending'])
                ->first();

            if (!$booking) {
                return [
                    'handled' => true, 
                    'success' => false, 
                    'message' => 'Booking not found or already processed'
                ];
            }

            // Kích hoạt ngữ cảnh tenant
            tenancy()->initialize($booking->tenant_id);

            // Tìm tất cả các booking liên quan (cùng khách hàng, cùng thời điểm khóa, cùng tenant)
            // để cập nhật hàng loạt (do 1 lần thanh toán cho nhiều slot)
            $lockedAt = $booking->locked_at;
            
            $relatedBookings = Booking::withoutGlobalScopes()
                ->where('tenant_id', $booking->tenant_id)
                ->where('customer_id', $booking->customer_id)
                ->where('locked_at', '>=', $lockedAt->copy()->subSecond())
                ->where('locked_at', '<=', $lockedAt->copy()->addSecond())
                ->whereIn('status', ['locked_pending', 'pending'])
                ->get();

            Log::info("SePay Webhook: Found " . $relatedBookings->count() . " related bookings for BK{$bookingId}");

            $totalRequired = $relatedBookings->sum('total_price');

            if ($transferAmount < (float) $totalRequired) {
                Log::error("SePay Webhook: Insufficient amount for Booking ID: {$bookingId}. Expected: {$totalRequired}, Received: {$transferAmount}");
                return [
                    'handled' => true, 
                    'success' => false, 
                    'message' => 'Insufficient amount'
                ];
            }

            try {
                DB::transaction(function () use ($relatedBookings) {
                    foreach ($relatedBookings as $b) {
                        // 1. Cập nhật trạng thái Booking sang đã thanh toán
                        $b->update([
                            'status' => 'paid',
                            'note' => $b->note . ' - Đã thanh toán qua SePay lúc ' . now()->format('H:i d/m/Y')
                        ]);

                        // 2. Tạo bản ghi thanh toán chi tiết
                        Payment::updateOrCreate(
                            [
                                'tenant_id' => $b->tenant_id,
                                'booking_id' => $b->id,
                            ],
                            [
                                'customer_id' => $b->customer_id,
                                'amount' => $b->total_price,
                                'payment_method' => 'sepay',
                                'type' => 'banking',
                                'status' => 'success',
                                'paid_at' => now(),
                            ]
                        );
                    }
                });

                Log::info("SePay Webhook: Successfully processed Booking ID: {$bookingId} and its related slots.");
                return [
                    'handled' => true, 
                    'success' => true
                ];
            } catch (\Exception $e) {
                Log::error("SePay Booking Webhook ERROR: " . $e->getMessage());
                throw $e;
            }
        }

        // Nếu không có mã BK, báo lại để controller thử service khác
        return [
            'handled' => false,
            'success' => false
        ];
    }
}
