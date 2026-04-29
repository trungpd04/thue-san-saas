<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SePayWebhookController extends Controller
{
    public function handle(Request $request)
    {
        Log::info('SePay Webhook Received:', $request->all());

        // 1. Xác thực API Key
        if ($request->header('x-api-key') !== config('services.sepay.webhook_key')) {
            Log::warning('SePay Webhook: Unauthorized access attempt.');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $content = $request->input('content');
        $transferAmount = (float) $request->input('transferAmount');

        // 2. Regex lấy mã giao dịch
        if (preg_match('/TS\d+/', $content, $matches)) {
            $transactionRef = $matches[0];

            // --- BƯỚC QUAN TRỌNG: TÌM TENANT ---
            // Bạn cần tìm Payment này ở database Central hoặc dùng query xuyên tenant 
            // Ở đây giả sử bảng subscription_payments của bạn có lưu tenant_id 
            // và bạn dùng model ở database Central để tìm trước.

            $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)
                ->where('status', 'pending')
                ->first();

            if (!$payment) {
                return response()->json(['success' => false, 'message' => 'Payment not found']);
            }

            // --- BƯỚC QUAN TRỌNG: KÍCH HOẠT NGỮ CẢNH TENANT ---
            // Nếu các bảng Subscription nằm ở DB riêng của Tenant, bạn phải bật nó lên:
            tenancy()->initialize($payment->tenant_id); 

            if ($transferAmount < $payment->amount) {
                Log::error("SePay Webhook: Insufficient amount for Ref: {$transactionRef}");
                return response()->json(['success' => false, 'message' => 'Insufficient amount']);
            }

            try {
                // Sử dụng DB::transaction để đảm bảo tính toàn vẹn
                DB::transaction(function () use ($payment, $transferAmount) {
                    // 1. Cập nhật Payment
                    $payment->update([
                        'status' => 'success',
                        'paid_at' => now(),
                    ]);

                    // 2. Cập nhật Subscription (Logic cộng dồn thời gian của Đức rất tốt)
                    $subscription = $payment->subscription;
                    $plan = $subscription->plan;

                    // Tính số tháng dựa trên số tiền (Tránh lỗi chia cho 0)
                    $months = ($plan->price_monthly > 0)
                        ? (int)round($payment->amount / $plan->price_monthly)
                        : 1;

                    $startDate = ($subscription->ends_at && $subscription->ends_at->isFuture())
                        ? $subscription->ends_at
                        : now();

                    $subscription->update([
                        'status' => 'active',
                        'starts_at' => ($subscription->status === 'active') ? $subscription->starts_at : now(),
                        'ends_at' => $startDate->copy()->addMonths($months),
                    ]);
                });

                Log::info("SePay Webhook: Successfully processed Ref: {$transactionRef}");
                return response()->json(['success' => true]);
            } catch (\Exception $e) {
                Log::error("SePay Webhook: Error: " . $e->getMessage());
                return response()->json(['success' => false], 500);
            }
        }

        return response()->json(['success' => false, 'message' => 'No ref found']);
    }
}
