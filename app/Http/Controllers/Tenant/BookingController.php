<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Models\FieldType;
use App\Models\Tenant\Booking;
use App\Services\PublicFieldService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function __construct(private readonly PublicFieldService $publicFieldService)
    {
    }

    public function index(Request $request)
    {
        $fieldTypeId = $request->query('field_type_id');

        return Inertia::render('Tenant/Booking', [
            'fieldType' => $fieldTypeId ? FieldType::query()->find($fieldTypeId) : null,
        ]);
    }

    public function availableSlots(Request $request)
    {
        $dateStr = $request->query('date', now()->format('Y-m-d'));
        $fieldTypeId = $request->query('field_type_id');
        $data = $this->publicFieldService->getAvailableSlots(tenant()->id, $dateStr, $fieldTypeId);

        return response()->json([
            'date' => $dateStr,
            'day_type' => $data['day_type'],
            'fields' => $data['fields'],
        ]);
    }

    public function history(Request $request)
    {
        $dateStr = $request->query('date', now()->format('Y-m-d'));
        $type = $request->query('type');
        $fieldTypeId = $request->query('field_type_id');

        $bookings = Booking::query()
            ->with(['field:id,name', 'customer:id,name,phone', 'payments' => function ($query) {
                $query->select('id', 'booking_id', 'amount', 'payment_method', 'type', 'status', 'paid_at')
                    ->latest();
            }])
            ->whereDate('booking_date', $dateStr)
            ->when($fieldTypeId, function ($query) use ($fieldTypeId) {
                $query->whereHas('field', function ($fieldQuery) use ($fieldTypeId) {
                    $fieldQuery->where('field_type_id', $fieldTypeId);
                });
            })
            ->when(in_array($type, ['cash', 'banking'], true), function ($query) use ($type) {
                $query->whereHas('payments', function ($paymentQuery) use ($type) {
                    $paymentQuery->where('type', $type);
                });
            })
            ->latest('created_at')
            ->get();

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function store(StoreBookingRequest $request)
    {
        $validated = $request->validated();
        $validated['payment_type'] = $validated['payment_type'] ?? 'cash';

        $createdBookings = $this->publicFieldService->storeBooking(
            tenant()->id,
            $validated,
            [
                'booked_by' => auth('tenant')->id(),
                'payment_type' => $validated['payment_type'],
            ]
        );

        return response()->json([
            'message' => 'Slot da duoc khoa tam thoi.',
            'payment_type' => $validated['payment_type'],
            'booking_ids' => collect($createdBookings)->pluck('id')->join(','),
        ]);
    }

    public function destroy(Booking $booking)
    {
        $booking->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Da huy booking.',
        ]);
    }
}
