<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Field;
use App\Http\Requests\StoreBookingRequest;
use App\Services\PublicFieldService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicFieldController extends Controller
{
    protected $publicFieldService;

    public function __construct(PublicFieldService $publicFieldService)
    {
        $this->publicFieldService = $publicFieldService;
    }

    public function index()
    {
        $fields = $this->publicFieldService->getActiveFields();

        return Inertia::render('Public/Fields', [
            'fields' => $fields,
        ]);
    }

    public function bookings(Request $request, Field $field)
    {
        $date = $request->query('date', now()->format('Y-m-d'));

        $bookings = $this->publicFieldService->getBookingsForField($field, $date);

        return response()->json([
            'date' => $date,
            'bookings' => $bookings
        ]);
    }

    // public function tenantBookings(Request $request, $tenant_id)
    // {
    //     $date = $request->query('date', now()->format('Y-m-d'));

    //     $fields = $this->publicFieldService->getTenantActiveFields($tenant_id);
    //     $fieldIds = $fields->pluck('id')->toArray();
    //     $bookings = $this->publicFieldService->getBookingsForTenantFields($fieldIds, $date);

    //     return response()->json([
    //         'date' => $date,
    //         'fields' => $fields,
    //         'bookings' => $bookings
    //     ]);
    // }

    public function showBookingPage(Request $request, $tenant_id)
    {
        $tenant = \App\Models\Tenant::findOrFail($tenant_id);
        $fieldTypeId = $request->query('field_type_id');
        $fieldType = $fieldTypeId ? \App\Models\FieldType::find($fieldTypeId) : null;
        
        return inertia('Public/BookingPage', [
            'tenant' => $tenant,
            'fieldType' => $fieldType
        ]);
    }

    public function availableSlots(Request $request, $tenant_id)
    {
        $dateStr = $request->query('date', now()->format('Y-m-d'));
        $fieldTypeId = $request->query('field_type_id');

        $data = $this->publicFieldService->getAvailableSlots($tenant_id, $dateStr, $fieldTypeId);

        return response()->json([
            'date' => $dateStr,
            'day_type' => $data['day_type'],
            'fields' => $data['fields'],
        ]);
    }

    public function storeBooking(StoreBookingRequest $request, $tenant_id)
    {
        try {
            $createdBookings = $this->publicFieldService->storeBooking($tenant_id, $request->validated());

            return response()->json([
                'message' => 'Đặt sân thành công!',
                'bookings' => $createdBookings
            ]);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'Một số khung giờ đã được đặt. Vui lòng chọn lại.') {
                return response()->json(['message' => $e->getMessage()], 409);
            }
            return response()->json(['message' => 'Có lỗi xảy ra khi tạo đặt sân.', 'error' => $e->getMessage()], 500);
        }
    }
}