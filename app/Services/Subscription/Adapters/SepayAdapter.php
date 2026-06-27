<?php

namespace App\Services\Subscription\Adapters;

use App\Services\Subscription\PaymentAdapter;
use App\Services\Subscription\TenantSubscriptionService;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Subscription;

class SepayAdapter implements PaymentAdapter
{
    protected string $bankAcc;
    protected string $bankId;

    public function __construct()
    {
        $this->bankAcc = config('services.sepay.bank_account');
        $this->bankId = config('services.sepay.bank_id');
    }

    public function createTransaction(SubscriptionPayment $payment): array
    {
        $transactionRef = 'TS' . str_pad($payment->id, 6, '0', STR_PAD_LEFT);
        $payment->update(['transaction_ref' => $transactionRef]);

        $payUrl = "https://qr.sepay.vn/img?acc={$this->bankAcc}&bank={$this->bankId}&amount={$payment->amount}&des={$transactionRef}&template=compact";

        return [
            'success' => true,
            'payment_url' => $payUrl,
            'transaction_ref' => $transactionRef,
            'amount' => $payment->amount,
        ];
    }

    public function processWebhook(array $data): array
    {
        $content = $data['content'] ?? '';
        $transferAmount = (float) ($data['transferAmount'] ?? 0);

        if (!preg_match('/TS\d+/', $content, $matches)) {
            return ['success' => false, 'message' => 'No matching reference found in content'];
        }

        $transactionRef = $matches[0];

        // Đóng vai trò là Adapter: Phân tích định dạng dữ liệu đặc thù của SePay
        // rồi ủy quyền thực thi nghiệp vụ kích hoạt cho TenantSubscriptionService
        return app(TenantSubscriptionService::class)->activateSubscription($transactionRef, $transferAmount);
    }
}
