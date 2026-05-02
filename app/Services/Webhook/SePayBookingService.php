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

        // Regex lấy mã đặt sân (BK + ID)
        if (preg_match('/BK(\d+)/', $content, $matches)) {
            $bookingId = $matches[1];

            // Tìm booking có trạng thái chờ thanh toán hoặc đã khóa
            $booking = Booking::where('id', $bookingId)
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

            if ($transferAmount < (float) $booking->total_price) {
                Log::error("SePay Webhook: Insufficient amount for Booking ID: {$bookingId}");
                return [
                    'handled' => true, 
                    'success' => false, 
                    'message' => 'Insufficient amount'
                ];
            }

            try {
                DB::transaction(function () use ($booking) {
                    // 1. Cập nhật trạng thái Booking sang đã thanh toán
                    $booking->update([
                        'status' => 'paid',
                        'note' => $booking->note . ' - Đã thanh toán qua SePay lúc ' . now()->format('H:i d/m/Y')
                    ]);

                    // 2. Tạo bản ghi thanh toán chi tiết
                    Payment::create([
                        'tenant_id' => $booking->tenant_id,
                        'booking_id' => $booking->id,
                        'customer_id' => $booking->customer_id,
                        'amount' => $booking->total_price,
                        'payment_method' => 'sepay',
                        'status' => 'success',
                        'paid_at' => now(),
                    ]);
                });

                Log::info("SePay Webhook: Successfully processed Booking ID: {$bookingId}");
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
