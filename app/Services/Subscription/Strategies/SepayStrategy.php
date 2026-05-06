<?php

namespace App\Services\Subscription\Strategies;

use App\Services\Subscription\PaymentStrategy;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Subscription;

class SepayStrategy implements PaymentStrategy
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

        $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)
            ->where('status', 'pending')
            ->first();

        if (!$payment) {
            return ['success' => false, 'message' => "Payment with ref {$transactionRef} not found or not pending"];
        }

        // Kích hoạt ngữ cảnh tenant để xử lý dữ liệu trong DB của tenant (nếu cần)
        tenancy()->initialize($payment->tenant_id);

        if ($transferAmount < $payment->amount) {
            Log::error("SePay Strategy: Insufficient amount for Ref: {$transactionRef}. Expected: {$payment->amount}, Got: {$transferAmount}");
            return ['success' => false, 'message' => 'Insufficient amount'];
        }

        try {
            DB::transaction(function () use ($payment) {
                // 1. Cập nhật Payment
                $payment->update([
                    'status' => 'success',
                    'paid_at' => now(),
                ]);

                // 2. Cập nhật Subscription
                $subscription = $payment->subscription;

                // Tìm gói cũ đang active
                $oldActiveSubscription = Subscription::where('tenant_id', $payment->tenant_id)
                    ->where('id', '!=', $subscription->id)
                    ->whereIn('status', ['active', 'trial'])
                    ->first();

                // Kích hoạt gói mới
                $subscription->update([
                    'status' => 'active',
                    'starts_at' => $payment->billing_period_start,
                    'ends_at' => $payment->billing_period_end,
                ]);

                if ($oldActiveSubscription) {
                    $oldActiveSubscription->update([
                        'status' => 'expired',
                        'ends_at' => now(),
                    ]);
                }
            });

            Log::info("SePay Strategy: Successfully processed Ref: {$transactionRef}");
            return ['success' => true];
        } catch (\Exception $e) {
            Log::error("SePay Strategy ERROR: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
