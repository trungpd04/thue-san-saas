<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Field;
use App\Http\Requests\StoreBookingRequest;
use App\Services\PublicFieldService;
use App\Services\SePayService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PublicFieldController extends Controller
{
    protected $publicFieldService;
    protected $sePayService;

    public function __construct(
        PublicFieldService $publicFieldService,
        SePayService $sePayService,
    ) {
        $this->publicFieldService = $publicFieldService;
        $this->sePayService = $sePayService;
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
                'message' => 'Slot đã được khóa tạm thời!',
                'booking_ids' => collect($createdBookings)->pluck('id')->join(',')
            ]);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'Sân hiện đang có người thao tác, vui lòng chọn slot khác hoặc quay lại sau.') {
                return response()->json(['message' => $e->getMessage()], 409);
            }
            return response()->json(['message' => 'Có lỗi xảy ra khi tạo đặt sân.', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkout(Request $request)
    {
        $bookingIds = collect(explode(',', $request->query('booking_ids', '')))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $bookings = \App\Models\Tenant\Booking::withoutGlobalScopes()
            ->whereIn('id', $bookingIds)
            ->with([
                'tenant',
                'customer' => fn ($query) => $query->withoutGlobalScopes(),
                'field' => fn ($query) => $query->withoutGlobalScopes()->with('fieldType'),
                'fieldSpecialEvent' => fn ($query) => $query->withoutGlobalScopes(),
                'payments' => fn ($query) => $query->withoutGlobalScopes()->latest(),
            ])
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->get();

        if ($bookings->isEmpty()) {
            return redirect()->route('public.fields.index')->with('error', 'Không tìm thấy thông tin đặt sân.');
        }

        $tenant = $bookings->first()->tenant;
        $totalAmount = (float) $bookings->sum('total_price');
        $paymentCode = 'BK' . $bookings->first()->id;
        $bankAccount = null;
        $paymentError = null;

        if (!$tenant->sepay_company_xid || !$tenant->has_linked_bank) {
            $paymentError = 'Chu san chua lien ket tai khoan ngan hang SePay Bank Hub.';
        } else {
            try {
                $bankAccounts = $this->sePayService->listBankAccounts($tenant->sepay_company_xid);
                $bankAccount = collect($bankAccounts)->first(function ($account) use ($tenant) {
                    return !$tenant->sepay_bank_account_xid
                        || ($account['xid'] ?? null) === $tenant->sepay_bank_account_xid;
                }) ?? $bankAccounts[0] ?? null;

                if (!$bankAccount) {
                    $paymentError = 'Khong tim thay tai khoan ngan hang da lien ket tren SePay Bank Hub.';
                }
            } catch (\Throwable $e) {
                Log::warning('Cannot load SePay Bank Hub account for checkout: ' . $e->getMessage(), [
                    'tenant_id' => $tenant->id,
                ]);

                $paymentError = 'Khong the tai thong tin tai khoan SePay Bank Hub. Vui long thu lai sau.';
            }
        }

        return Inertia::render('Public/Checkout', [
            'bookings' => $this->formatCheckoutBookings($bookings),
            'tenant' => $tenant,
            'payment' => [
                'code' => $paymentCode,
                'amount' => $totalAmount,
                'bank_account' => $bankAccount,
                'error' => $paymentError,
                'webhook_url' => url('/api/webhooks/sepay/bankhub'),
                'webhook_token' => config('app.env') === 'local' ? config('services.sepay.webhook_key') : null,
            ],
        ]);
    }

    public function checkPaymentStatus(Request $request)
    {
        $bookingIds = collect(explode(',', $request->query('booking_ids', '')))
            ->map(fn ($id) => (int) trim($id))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $bookings = \App\Models\Tenant\Booking::withoutGlobalScopes()
            ->whereIn('id', $bookingIds)
            ->with([
                'customer' => fn ($query) => $query->withoutGlobalScopes(),
                'field' => fn ($query) => $query->withoutGlobalScopes()->with('fieldType'),
                'fieldSpecialEvent' => fn ($query) => $query->withoutGlobalScopes(),
                'payments' => fn ($query) => $query->withoutGlobalScopes()->latest(),
            ])
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->get();

        // Check if ALL bookings are paid or confirmed
        $isPaid = $bookings->every(function ($booking) {
            return in_array($booking->status, ['paid', 'confirmed']);
        });

        return response()->json([
            'paid' => $isPaid,
            'status' => $bookings->pluck('status', 'id'),
            'bookings' => $this->formatCheckoutBookings($bookings),
        ]);
    }

    private function formatCheckoutBookings(Collection $bookings): array
    {
        return $bookings->map(function ($booking) {
            $payment = $booking->payments->first();

            return [
                'id' => $booking->id,
                'code' => 'BK' . $booking->id,
                'tenant_id' => $booking->tenant_id,
                'booking_date' => optional($booking->booking_date)->toDateString(),
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'base_price' => (float) $booking->base_price,
                'event_surcharge_amount' => (float) $booking->event_surcharge_amount,
                'total_price' => (float) $booking->total_price,
                'pricing_breakdown' => $booking->pricing_breakdown ?? [],
                'status' => $booking->status,
                'locked_at' => optional($booking->locked_at)->toIso8601String(),
                'created_at' => optional($booking->created_at)->toIso8601String(),
                'note' => $booking->note,
                'customer' => [
                    'id' => $booking->customer?->id,
                    'name' => $booking->customer?->name,
                    'phone' => $booking->customer?->phone,
                    'email' => $booking->customer?->email,
                    'address' => $booking->customer?->address,
                ],
                'field' => [
                    'id' => $booking->field?->id,
                    'name' => $booking->field?->name,
                    'location' => $booking->field?->location,
                    'description' => $booking->field?->description,
                    'field_type' => [
                        'id' => $booking->field?->fieldType?->id,
                        'name' => $booking->field?->fieldType?->name,
                    ],
                ],
                'special_event' => $booking->fieldSpecialEvent ? [
                    'id' => $booking->fieldSpecialEvent->id,
                    'title' => $booking->fieldSpecialEvent->title,
                    'effect' => $booking->fieldSpecialEvent->effect,
                    'surge_percent' => $booking->fieldSpecialEvent->surge_percent,
                ] : null,
                'payment' => $payment ? [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'type' => $payment->type,
                    'status' => $payment->status,
                    'paid_at' => optional($payment->paid_at)->toIso8601String(),
                    'note' => $payment->note,
                ] : null,
            ];
        })->values()->all();
    }
}
