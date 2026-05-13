<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Field;
use App\Http\Requests\StoreBookingRequest;
use App\Services\PublicFieldService;
use App\Services\SePayService;
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
        $bookingIds = explode(',', $request->query('booking_ids', ''));

        // Find bookings (globally since we don't have tenant context yet in the URL)
        $bookings = \App\Models\Tenant\Booking::whereIn('id', $bookingIds)
            ->with(['field', 'tenant'])
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
            'bookings' => $bookings,
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
        $bookingIds = explode(',', $request->query('booking_ids', ''));
        $bookings = \App\Models\Tenant\Booking::withoutGlobalScopes()->whereIn('id', $bookingIds)->get();

        // Check if ALL bookings are paid or confirmed
        $isPaid = $bookings->every(function ($booking) {
            return in_array($booking->status, ['paid', 'confirmed']);
        });

        return response()->json([
            'paid' => $isPaid,
            'status' => $bookings->pluck('status', 'id')
        ]);
    }
}
