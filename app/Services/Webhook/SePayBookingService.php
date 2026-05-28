<?php

namespace App\Services\Webhook;

use App\Models\Tenant\Booking;
use App\Models\Tenant\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SePayBookingService
{
    public function handle(array $data): array
    {
        $content = $data['content']
            ?? $data['transaction_content']
            ?? $data['description']
            ?? '';

        $transferAmount = (float) (
            $data['transferAmount']
            ?? $data['amount_in']
            ?? $data['amount']
            ?? 0
        );

        if (!preg_match('/BK\s*(\d+)/i', $content, $matches)) {
            return [
                'handled' => false,
                'success' => false,
                'message' => 'No booking payment code found',
            ];
        }

        $bookingId = $matches[1];
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

        tenancy()->initialize($booking->tenant_id);

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

        Log::info('SePay Bank Hub booking payment matched.', [
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

        DB::transaction(function () use ($relatedBookings, $data): void {
            foreach ($relatedBookings as $relatedBooking) {
                $relatedBooking->update([
                    'status' => 'paid',
                    'note' => trim(($relatedBooking->note ? $relatedBooking->note . ' - ' : '') . 'Da thanh toan qua SePay Bank Hub luc ' . now()->format('H:i d/m/Y')),
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
                        'paid_at' => now(),
                        'note' => 'SePay Bank Hub transaction: ' . ($data['transaction_id'] ?? $data['id'] ?? 'sandbox'),
                    ]
                );
            }
        });

        return [
            'handled' => true,
            'success' => true,
            'message' => 'Booking payment processed',
        ];
    }
}
