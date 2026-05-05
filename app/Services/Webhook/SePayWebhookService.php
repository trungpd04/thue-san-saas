<?php

namespace App\Services\Webhook;

use App\Services\Webhook\Strategies\SePayStrategyInterface;
use App\Services\Webhook\Strategies\TenantSubscriptionStrategy;

class SePayWebhookService
{
    /**
     * @var SePayStrategyInterface[]
     */
    protected array $strategies;

    public function __construct()
    {
        // Khởi tạo danh sách các strategies. 
        // Sử dụng app() để Laravel tự động inject các dependency vào Strategy (nếu có).
        $this->strategies = [
            app(TenantSubscriptionStrategy::class),
            // Bạn có thể thêm các Strategy mới vào đây trong tương lai (ví dụ mua SMS, mua Add-on...)
        ];
    }

    /**
     * Xử lý webhook từ SePay bằng cách uỷ quyền cho Strategy phù hợp
     */
    public function handle(array $data): array
    {
        $content = $data['content'] ?? '';

        // Duyệt qua từng strategy
        foreach ($this->strategies as $strategy) {
            // Nếu strategy này nhận diện được nội dung chuyển khoản
            if ($strategy->canHandle($content)) {
                return $strategy->handle($data);
            }
        }

        // Nếu không có strategy nào phù hợp
        return ['success' => false, 'message' => 'No matching strategy found for content'];
    }
}



// <?php

// namespace App\Services\Webhook;

// use App\Models\SubscriptionPayment;
// use Illuminate\Support\Facades\Log;
// use Illuminate\Support\Facades\DB;
// use App\Models\Subscription;

// class SePayWebhookService
// {
//     /**
//      * Xử lý webhook từ SePay
//      */
//     public function handle($data)
//     {
//         $content = $data['content'] ?? '';
//         $transferAmount = (float) ($data['transferAmount'] ?? 0);

//         // Regex lấy mã giao dịch
//         if (preg_match('/TS\d+/', $content, $matches)) {
//             $transactionRef = $matches[0];

//             $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)
//                 ->where('status', 'pending')
//                 ->first();

//             if (!$payment) {
//                 return ['success' => false, 'message' => 'Payment not found'];
//             }

//             // Kích hoạt ngữ cảnh tenant
//             tenancy()->initialize($payment->tenant_id); 

//             if ($transferAmount < $payment->amount) {
//                 Log::error("SePay Webhook: Insufficient amount for Ref: {$transactionRef}");
//                 return ['success' => false, 'message' => 'Insufficient amount'];
//             }

//             try {
//                 DB::transaction(function () use ($payment, $transferAmount) {
//                     // 1. Cập nhật Payment
//                     $payment->update([
//                         'status' => 'success',
//                         'paid_at' => now(),
//                     ]);

//                     // 2. Cập nhật Subscription
//                     $subscription = $payment->subscription;


//                     // Tìm gói cũ đang active để lấy ngày hết hạn (nếu muốn nối tiếp) và xóa sau đó
//                     $oldActiveSubscription = Subscription::where('tenant_id', $payment->tenant_id)
//                         ->where('id', '!=', $subscription->id)
//                         ->whereIn('status', ['active', 'trial'])
//                         ->first();


//                     // Kích hoạt gói mới
//                     $subscription->update([
//                         'status' => 'active',
//                         'starts_at' => $payment->billing_period_start, // Ngày bắt đầu thực tế của bản ghi này
//                         'ends_at' => $payment->billing_period_end, // Ngày kết thúc thực tế
//                     ]);

                    
//                     if ($oldActiveSubscription) {
//                         // Xóa gói cũ sau khi gói mới đã active (theo yêu cầu)
//                         // $oldActiveSubscription->payments()->delete();
//                         // $oldActiveSubscription->delete();
//                         $oldActiveSubscription->update([
//                             'status' => 'expired',
//                             'ends_at' => now(), // Đánh dấu kết thúc tại thời điểm này để nhường chỗ cho gói mới
//                         ]);
//                     }
//                 });

//                 Log::info("SePay Webhook: Successfully processed Ref: {$transactionRef}");
//                 return ['success' => true];
//             } catch (\Exception $e) {
//                 Log::error("SePay Webhook ERROR: " . $e->getMessage());
//                 throw $e;
//             }
//         }

//         return ['success' => false, 'message' => 'No ref found'];
//     }
// }
