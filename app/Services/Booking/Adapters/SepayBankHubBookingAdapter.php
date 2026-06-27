<?php

namespace App\Services\Booking\Adapters;

use App\Services\Booking\BookingPaymentAdapter;
use App\Services\Booking\BookingPaymentService;
use App\Models\Tenant\Booking;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use App\Services\SePayService;

class SepayBankHubBookingAdapter implements BookingPaymentAdapter
{
    protected SePayService $sePayService;

    public function __construct(SePayService $sePayService)
    {
        $this->sePayService = $sePayService;
    }

    /**
     * Tạo thông tin thanh toán booking qua SePay BankHub
     * (Tạo QR code chuyển khoản với nội dung BK{booking_id})
     *
     * @param Collection<int, Booking> $bookings
     * @param array $context ['bank_account' => [...], 'tenant' => Tenant]
     * @return array
     */
    public function createTransaction(Collection $bookings, array $context = []): array
    {
        if ($bookings->isEmpty()) {
            return ['success' => false, 'message' => 'No bookings provided'];
        }

        $totalAmount = (float) $bookings->sum('total_price');
        $paymentCode = 'BK' . $bookings->first()->id;
        $bankAccount = $context['bank_account'] ?? null;
        $tenant = $context['tenant'] ?? null;

        if (!$bankAccount && $tenant && $tenant->sepay_company_xid && $tenant->has_linked_bank) {
            try {
                $bankAccounts = $this->sePayService->listBankAccounts($tenant->sepay_company_xid);
                $bankAccount = collect($bankAccounts)->first(function ($account) use ($tenant) {
                    return !$tenant->sepay_bank_account_xid
                        || ($account['xid'] ?? null) === $tenant->sepay_bank_account_xid;
                }) ?? $bankAccounts[0] ?? null;
            } catch (\Throwable $e) {
                Log::warning('Cannot load SePay Bank Hub account in Adapter: ' . $e->getMessage());
            }
        }

        if (!$bankAccount) {
            return [
                'success' => false,
                'message' => 'Không tìm thấy tài khoản ngân hàng đã liên kết trên SePay Bank Hub.',
            ];
        }

        // Lấy thông tin tài khoản để tạo QR
        $accountNumber = $bankAccount['account_number'] ?? $bankAccount['acc_number'] ?? '';
        $bankName = $bankAccount['bank_name'] ?? $bankAccount['bank_short_name'] ?? '';

        return [
            'success' => true,
            'payment_code' => $paymentCode,
            'amount' => $totalAmount,
            'bank_account' => $bankAccount,
            'booking_ids' => $bookings->pluck('id')->toArray(),
        ];
    }

    /**
     * Xử lý webhook từ SePay BankHub cho booking payment
     * Adapter chỉ phân tích định dạng dữ liệu đặc thù của SePay BankHub,
     * rồi ủy quyền nghiệp vụ kích hoạt cho BookingPaymentService
     *
     * @param array $data
     * @return array
     */
    public function processWebhook(array $data): array
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

        // Phân tích mã booking từ nội dung chuyển khoản (đặc thù SePay)
        if (!preg_match('/BK\s*(\d+)/i', $content, $matches)) {
            return [
                'handled' => false,
                'success' => false,
                'message' => 'No booking payment code found',
            ];
        }

        $bookingId = (int) $matches[1];

        Log::info('SepayBankHubBookingAdapter: Webhook matched booking', [
            'booking_id' => $bookingId,
            'amount' => $transferAmount,
            'transaction_id' => $data['transaction_id'] ?? $data['id'] ?? 'unknown',
        ]);

        // Ủy quyền nghiệp vụ kích hoạt cho BookingPaymentService
        return app(BookingPaymentService::class)->activateBookingPayment($bookingId, $transferAmount);
    }
}
