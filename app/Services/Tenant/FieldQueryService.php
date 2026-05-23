<?php

namespace App\Services\Tenant;

use App\Contracts\Tenant\IFieldQueryService;
use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\FieldPrice;
use Illuminate\Support\Carbon;

class FieldQueryService implements IFieldQueryService
{
    public function getActiveFields($lat = null, $lng = null, $fieldTypeId = null, $name = null): array
    {
        $query = Field::with(['tenant', 'fieldType'])->active();

        if ($fieldTypeId) {
            $query->filterByType($fieldTypeId);
        }

        if ($name) {
            $query->filterByName($name);
        }

        if ($lat && $lng) {
            $query->withDistance($lat, $lng);
        }

        $fields = $query->get();

        $grouped = [];
        foreach ($fields as $field) {
            if (!$field->tenant || !$field->fieldType) continue;

            $key = $field->tenant_id . '_' . $field->field_type_id;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tenant' => $field->tenant,
                    'field_type' => $field->fieldType,
                    'location' => $field->tenant->address,
                    'latitude' => $field->tenant->latitude,
                    'longitude' => $field->tenant->longitude,
                    'distance' => isset($field->distance) ? round($field->distance, 2) : null,
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
            ->where(function($query) {
                $query->whereIn('status', ['pending', 'confirmed', 'paid'])
                    ->orWhere(function($q) {
                        $q->where('status', 'locked_pending')
                          ->where('locked_at', '>=', now()->subMinutes(5));
                    });
            })
            ->get(['start_time', 'end_time']);
    }

    public function getTenantActiveFields(string $tenantId, $fieldTypeId = null)
    {
        $query = Field::where('tenant_id', $tenantId)->where('is_active', true);
        if ($fieldTypeId) {
            $query->where('field_type_id', $fieldTypeId);
        }
        return $query->orderBy('name')->get(['id', 'name', 'field_type_id']);
    }

    public function getBookingsForTenantFields(array $fieldIds, string $dateStr)
    {
        return Booking::whereIn('field_id', $fieldIds)
            ->whereDate('booking_date', $dateStr)
            ->where(function($query) {
                $query->whereIn('status', ['pending', 'confirmed', 'paid'])
                    ->orWhere(function($q) {
                        $q->where('status', 'locked_pending')
                          ->where('locked_at', '>=', now()->subMinutes(5));
                    });
            })
            ->get(['id', 'field_id', 'start_time', 'end_time', 'status']);
    }

    public function getAvailableSlots(string $tenantId, string $dateStr, $fieldTypeId = null): array
    {
        $date = Carbon::parse($dateStr);
        $dayType = $date->isWeekend() ? 'weekend' : 'weekday';

        $fields = $this->getTenantActiveFields($tenantId, $fieldTypeId);
        $fieldIds = $fields->pluck('id')->toArray();
        $bookings = $this->getBookingsForTenantFields($fieldIds, $dateStr);

        $fieldTypeIds = $fields->pluck('field_type_id')->unique()->toArray();
        $fieldPrices = FieldPrice::where('tenant_id', $tenantId)
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

                    // Check availability and status
                    $slotStatus = 'available'; // available, booked, pending_payment
                    foreach ($fieldBookings as $booking) {
                        if ($booking->start_time < $endSlot && $booking->end_time > $startSlot) {
                            $slotStatus = ($booking->status === 'locked_pending') ? 'pending_payment' : 'booked';
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
                        'status' => $slotStatus,
                        'is_available' => $slotStatus === 'available',
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
}
