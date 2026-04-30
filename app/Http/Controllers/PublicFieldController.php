<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Field;
use App\Models\Tenant\Booking;
use App\Models\Tenant\FieldPrice;
use App\Models\Tenant\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class PublicFieldController extends Controller
{
    public function index()
    {
        $fields = Field::with(['tenant', 'fieldType'])
            ->where('is_active', true)
            ->latest()
            ->get();

        return Inertia::render('Public/Fields', [
            'fields' => $fields,
        ]);
    }

    public function bookings(Request $request, Field $field)
    {
        $date = $request->query('date', now()->format('Y-m-d'));

        $bookings = Booking::where('field_id', $field->id)
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed', 'paid'])
            ->get(['start_time', 'end_time']);

        return response()->json([
            'date' => $date,
            'bookings' => $bookings
        ]);
    }

    public function tenantBookings(Request $request, $tenant_id)
    {
        $date = $request->query('date', now()->format('Y-m-d'));

        $fields = Field::where('tenant_id', $tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $fieldIds = $fields->pluck('id')->toArray();

        $bookings = Booking::whereIn('field_id', $fieldIds)
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed', 'paid'])
            ->get(['id', 'field_id', 'start_time', 'end_time']);

        return response()->json([
            'date' => $date,
            'fields' => $fields,
            'bookings' => $bookings
        ]);
    }

    public function showBookingPage($tenant_id)
    {
        $tenant = \App\Models\Tenant::findOrFail($tenant_id);
        
        return inertia('Public/BookingPage', [
            'tenant' => $tenant
        ]);
    }

    public function availableSlots(Request $request, $tenant_id)
    {
        $dateStr = $request->query('date', now()->format('Y-m-d'));
        $date = Carbon::parse($dateStr);
        $dayType = $date->isWeekend() ? 'weekend' : 'weekday';

        $fields = Field::where('tenant_id', $tenant_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'field_type_id']);

        $fieldIds = $fields->pluck('id')->toArray();

        $bookings = Booking::whereIn('field_id', $fieldIds)
            ->whereDate('booking_date', $dateStr)
            ->whereIn('status', ['pending', 'confirmed', 'paid'])
            ->get(['id', 'field_id', 'start_time', 'end_time']);

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

        return response()->json([
            'date' => $dateStr,
            'day_type' => $dayType,
            'fields' => $result,
        ]);
    }

    public function storeBooking(Request $request, $tenant_id)
    {
        $request->validate([
            'date' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'note' => 'nullable|string|max:1000',
            'total_price' => 'required|numeric|min:0',
            'pricing_breakdown' => 'required|array',
            'pricing_breakdown.*.field_id' => 'required|exists:fields,id',
            'pricing_breakdown.*.start_time' => 'required|date_format:H:i',
            'pricing_breakdown.*.end_time' => 'required|date_format:H:i',
            'pricing_breakdown.*.price' => 'required|numeric|min:0',
        ]);

        $dateStr = $request->date;
        $breakdown = $request->pricing_breakdown;

        // Validation against double booking
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
                return response()->json(['message' => 'Một số khung giờ đã được đặt. Vui lòng chọn lại.'], 409);
            }
        }

        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenant_id, 'phone' => $request->customer_phone],
            ['name' => $request->customer_name]
        );

        $groupedBreakdown = collect($breakdown)->groupBy('field_id');
        $createdBookings = [];

        \Illuminate\Support\Facades\DB::beginTransaction();
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
                            $createdBookings[] = $this->createBookingFromGroup($tenant_id, $fieldId, $customer->id, $dateStr, $currentGroup, $request->note);
                            $currentGroup = [$slot];
                        }
                    }
                }
                if (!empty($currentGroup)) {
                    $createdBookings[] = $this->createBookingFromGroup($tenant_id, $fieldId, $customer->id, $dateStr, $currentGroup, $request->note);
                }
            }
            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Có lỗi xảy ra khi tạo đặt sân.', 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'message' => 'Đặt sân thành công!',
            'bookings' => $createdBookings
        ]);
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