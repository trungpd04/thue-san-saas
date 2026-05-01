<?php

namespace App\Services;

use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\FieldPrice;
use App\Models\Tenant\Customer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PublicFieldService
{
    public function getActiveFields()
    {
        $fields = Field::with(['tenant', 'fieldType'])
            ->where('is_active', true)
            ->get();

        $grouped = [];
        foreach ($fields as $field) {
            if (!$field->tenant || !$field->fieldType) continue;

            $key = $field->tenant_id . '_' . $field->field_type_id;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tenant' => $field->tenant,
                    'field_type' => $field->fieldType,
                    'location' => $field->location,
                    'description' => $field->fieldType->description ?? $field->description,
                ];
            }
        }

        return array_values($grouped);
    }

    public function getBookingsForField(Field $field, string $dateStr)
    {
        return Booking::where('field_id', $field->id)
            ->whereDate('booking_date', $dateStr)
            ->whereIn('status', ['pending', 'confirmed', 'paid'])
            ->get(['start_time', 'end_time']);
    }

    public function getTenantActiveFields($tenant_id, $field_type_id = null)
    {
        $query = Field::where('tenant_id', $tenant_id)->where('is_active', true);
        if ($field_type_id) {
            $query->where('field_type_id', $field_type_id);
        }
        return $query->orderBy('name')->get(['id', 'name', 'field_type_id']);
    }

    public function getBookingsForTenantFields(array $fieldIds, string $dateStr)
    {
        return Booking::whereIn('field_id', $fieldIds)
            ->whereDate('booking_date', $dateStr)
            ->whereIn('status', ['pending', 'confirmed', 'paid'])
            ->get(['id', 'field_id', 'start_time', 'end_time']);
    }

    public function getAvailableSlots($tenant_id, string $dateStr, $field_type_id = null)
    {
        $date = Carbon::parse($dateStr);
        $dayType = $date->isWeekend() ? 'weekend' : 'weekday';

        $fields = $this->getTenantActiveFields($tenant_id, $field_type_id);
        $fieldIds = $fields->pluck('id')->toArray();
        $bookings = $this->getBookingsForTenantFields($fieldIds, $dateStr);

        $fieldTypeIds = $fields->pluck('field_type_id')->unique()->toArray();
        $fieldPrices = FieldPrice::where('tenant_id', $tenant_id)
            ->whereIn('field_type_id', $fieldTypeIds)
            ->where('day_type', $dayType)
            ->get();

        $result = [];

        foreach ($fields as $field) {
            $slots = [];
            $prices = $fieldPrices->where('field_type_id', $field->field_type_id);
            $fieldBookings = $bookings->where('field_id', $field->id);

            for ($hour = 6; $hour <= 22; $hour++) {
                $slotsToGenerate = [
                    [
                        'start' => sprintf('%02d:00:00', $hour), 
                        'end' => sprintf('%02d:30:00', $hour), 
                        'display_start' => sprintf('%02d:00', $hour), 
                        'display_end' => sprintf('%02d:30', $hour)
                    ],
                    [
                        'start' => sprintf('%02d:30:00', $hour), 
                        'end' => sprintf('%02d:00:00', $hour + 1), 
                        'display_start' => sprintf('%02d:30', $hour), 
                        'display_end' => sprintf('%02d:00', $hour + 1)
                    ],
                ];

                foreach ($slotsToGenerate as $slotGen) {
                    $startSlot = $slotGen['start'];
                    $endSlot = $slotGen['end'];
                    $startSlotDisplay = $slotGen['display_start'];
                    $endSlotDisplay = $slotGen['display_end'];

                    // Check availability
                    $isAvailable = true;
                    foreach ($fieldBookings as $booking) {
                        if ($booking->start_time < $endSlot && $booking->end_time > $startSlot) {
                            $isAvailable = false;
                            break;
                        }
                    }

                    // Get price
                    $slotPrice = 0;
                    foreach ($prices as $price) {
                        if ($price->start_time <= $startSlot && $price->end_time >= $endSlot) {
                            $slotPrice = ((float) $price->price_per_hour) / 2;
                            break;
                        }
                    }

                    $slots[] = [
                        'start_time' => $startSlotDisplay,
                        'end_time' => $endSlotDisplay,
                        'price_per_hour' => $slotPrice,
                        'is_available' => $isAvailable,
                    ];
                }
            }

            $result[] = [
                'id' => $field->id,
                'name' => $field->name,
                'slots' => $slots,
            ];
        }

        return [
            'day_type' => $dayType,
            'fields' => $result,
        ];
    }

    public function storeBooking($tenant_id, array $validatedData)
    {
        $dateStr = $validatedData['date'];
        $breakdown = $validatedData['pricing_breakdown'];

        $this->validateNoOverlappingBookings($dateStr, $breakdown);

        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenant_id, 'phone' => $validatedData['customer_phone']],
            ['name' => $validatedData['customer_name']]
        );

        $groupedBreakdown = collect($breakdown)->groupBy('field_id');
        $createdBookings = [];

        DB::beginTransaction();
        try {
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
                            $createdBookings[] = $this->createBookingFromGroup($tenant_id, $fieldId, $customer->id, $dateStr, $currentGroup, $validatedData['note'] ?? null);
                            $currentGroup = [$slot];
                        }
                    }
                }
                if (!empty($currentGroup)) {
                    $createdBookings[] = $this->createBookingFromGroup($tenant_id, $fieldId, $customer->id, $dateStr, $currentGroup, $validatedData['note'] ?? null);
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
            
            $overlapping = Booking::where('field_id', $slot['field_id'])
                ->whereDate('booking_date', $dateStr)
                ->whereIn('status', ['pending', 'confirmed', 'paid'])
                ->where('start_time', '<', $endSlot)
                ->where('end_time', '>', $startSlot)
                ->exists();

            if ($overlapping) {
                throw new \Exception('Một số khung giờ đã được đặt. Vui lòng chọn lại.');
            }
        }
    }

    private function createBookingFromGroup($tenant_id, $field_id, $customer_id, $date, $slots, $note = null)
    {
        $startTime = $slots[0]['start_time'] . ':00';
        $endTime = end($slots)['end_time'] . ':00';
        $totalPrice = collect($slots)->sum('price');
        
        return Booking::create([
            'tenant_id' => $tenant_id,
            'field_id' => $field_id,
            'customer_id' => $customer_id,
            'booking_date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'base_price' => $totalPrice,
            'total_price' => $totalPrice,
            'pricing_breakdown' => collect($slots)->map(function ($s) { return (array)$s; })->toArray(),
            'status' => 'pending',
            'note' => $note ?: 'Web public booking',
        ]);
    }
}
