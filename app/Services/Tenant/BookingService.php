<?php

namespace App\Services\Tenant;

use App\Contracts\Tenant\IBookingService;
use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\Customer;
use App\Models\Tenant\Payment;
use App\Models\Tenant\FieldSpecialEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class BookingService implements IBookingService
{
    public function storeBooking(string $tenantId, array $validatedData, array $options = []): array
    {
        $dateStr = $validatedData['date'];
        $breakdown = $validatedData['pricing_breakdown'];
        $now = now(); // Capture once for all bookings in this transaction
        $paymentType = $validatedData['payment_type'] ?? $options['payment_type'] ?? 'banking';
        $bookedBy = $options['booked_by'] ?? null;

        DB::beginTransaction();
        try {
            // Lock fields to prevent concurrent bookings
            $fieldIdsToLock = collect($breakdown)->pluck('field_id')->unique()->toArray();
            Field::whereIn('id', $fieldIdsToLock)->lockForUpdate()->get();

            $this->validateNoOverlappingBookings($dateStr, $breakdown);

            $customer = Customer::firstOrCreate(
                ['tenant_id' => $tenantId, 'phone' => $validatedData['customer_phone']],
                ['name' => $validatedData['customer_name']]
            );

            $groupedBreakdown = collect($breakdown)->groupBy('field_id');
            $createdBookings = [];

            foreach ($groupedBreakdown as $fieldId => $slots) {
                $slots = collect($slots)->sortBy('start_time')->values()->toArray();
                $currentGroup = [];
                foreach ($slots as $slot) {
                    if (empty($currentGroup)) {
                        $currentGroup[] = $slot;
                    } else {
                        $lastSlot = end($currentGroup);
                        if ($lastSlot['end_time'] === $slot['start_time']) {
                            $currentGroup[] = $slot;
                        } else {
                            $createdBookings[] = $this->createBookingFromGroup($tenantId, $fieldId, $customer->id, $dateStr, $currentGroup, $validatedData['note'] ?? null, $now, $paymentType, $bookedBy);
                            $currentGroup = [$slot];
                        }
                    }
                }
                if (!empty($currentGroup)) {
                    $createdBookings[] = $this->createBookingFromGroup($tenantId, $fieldId, $customer->id, $dateStr, $currentGroup, $validatedData['note'] ?? null, $now, $paymentType, $bookedBy);
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $createdBookings;
    }

    private function validateNoOverlappingBookings(string $dateStr, array $breakdown)
    {
        foreach ($breakdown as $slot) {
            $startSlot = $slot['start_time'] . ':00';
            $endSlot = $slot['end_time'] . ':00';
            
            // 1. Kiểm tra xem có bị trùng lặp với các đơn đặt sân hiện tại không
            $overlapping = Booking::where('field_id', $slot['field_id'])
                ->whereDate('booking_date', $dateStr)
                ->whereIn('status', ['locked_pending', 'pending', 'confirmed', 'paid'])
                ->where('start_time', '<', $endSlot)
                ->where('end_time', '>', $startSlot)
                ->exists();

            if ($overlapping) {
                throw new \Exception('Sân hiện đang có người thao tác, vui lòng chọn slot khác hoặc quay lại sau.');
            }

            // 2. Kiểm tra xem có bị chặn bởi sự kiện Khóa sân nào không
            $isBlocked = FieldSpecialEvent::where('event_date', $dateStr)
                ->where('effect', FieldSpecialEvent::EFFECT_BLOCK)
                ->where(function ($query) use ($slot) {
                    $query->where('field_id', $slot['field_id'])
                        ->orWhereNull('field_id');
                })
                ->where('start_time', '<', $endSlot)
                ->where('end_time', '>', $startSlot)
                ->exists();

            if ($isBlocked) {
                throw new \Exception('Sân hiện đã bị khóa do sự kiện đặc biệt tại khung giờ này.');
            }
        }
    }

    private function createBookingFromGroup($tenant_id, $field_id, $customer_id, $date, $slots, $note = null, $lockedAt = null, string $paymentType = 'banking', $bookedBy = null)
    {
        $startTime = $slots[0]['start_time'] . ':00';
        $endTime = end($slots)['end_time'] . ':00';
        $totalPrice = collect($slots)->sum('price');
        
        $isCash = $paymentType === 'cash';

        // Tìm sự kiện tăng giá giao cắt để tính toán và lưu trữ phụ thu
        $event = FieldSpecialEvent::where('event_date', $date)
            ->where('effect', FieldSpecialEvent::EFFECT_SURGE)
            ->where(function ($query) use ($field_id) {
                $query->where('field_id', $field_id)
                    ->orWhereNull('field_id');
            })
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->first();

        $eventSurchargeAmount = 0.0;
        $basePrice = $totalPrice;
        $eventId = null;

        if ($event) {
            $eventId = $event->id;
            $surgePercent = $event->surge_percent ?? 0;
            // base_price * (1 + surge_percent / 100) = total_price -> base_price = total_price / (1 + surge_percent / 100)
            $basePrice = $totalPrice / (1 + $surgePercent / 100);
            $eventSurchargeAmount = $totalPrice - $basePrice;
        }

        $booking = Booking::create([
            'tenant_id' => $tenant_id,
            'field_id' => $field_id,
            'customer_id' => $customer_id,
            'booking_date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'base_price' => $basePrice,
            'event_surcharge_amount' => $eventSurchargeAmount,
            'total_price' => $totalPrice,
            'field_special_event_id' => $eventId,
            'pricing_breakdown' => collect($slots)->map(function ($s) { return (array)$s; })->toArray(),
            'status' => $isCash ? 'paid' : 'locked_pending',
            'locked_at' => $lockedAt ?: now(),
            'note' => $note ?: ($bookedBy ? 'Offline staff booking' : 'Web public booking'),
            'booked_by' => $bookedBy,
        ]);

        Payment::create([
            'tenant_id' => $tenant_id,
            'booking_id' => $booking->id,
            'customer_id' => $customer_id,
            'amount' => $totalPrice,
            'payment_method' => $isCash ? 'cash' : 'sepay',
            'type' => $paymentType,
            'status' => $isCash ? 'success' : 'pending',
            'paid_at' => $isCash ? now() : null,
            'note' => $bookedBy ? 'Staff selected payment type' : 'Public booking payment',
        ]);

        return $booking;
    }
}
