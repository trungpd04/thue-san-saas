<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class SubscriptionRegistrationController extends Controller
{
    public function index()
    {
        $plans = Plan::where('is_active', true)->get();
        $tenant = tenant();

        // Lấy subscription hiện tại
        $currentSubscription = Subscription::where('tenant_id', $tenant->id)
            ->with('plan')
            ->first();

        return \Inertia\Inertia::render('Tenant/Subscription/Register', [
            'plans' => $plans,
            'currentSubscription' => $currentSubscription
        ]);
    }

    public function status()
    {
        $tenant = tenant();
        $payments = SubscriptionPayment::where('tenant_id', $tenant->id)
            ->with('subscription.plan')
            ->latest()
            ->get();

        return \Inertia\Inertia::render('Tenant/Subscription/Status', [
            'payments' => $payments
        ]);
    }
    /**
     * Xử lý tạo yêu cầu đăng ký gói và thanh toán
     */
    public function register(Request $request)
    {
        // 1. Validate dữ liệu
        $request->validate([
            'plan_id' => [
                'required',
                Rule::exists(Plan::class, 'id'),
            ],
            'months' => 'required|integer|min:1|max:36', // Giới hạn từ 1-36 tháng
        ]);

        $plan = Plan::findOrFail($request->plan_id);
        $months = (int) $request->months;
        $tenant = tenant(); // Lấy tenant hiện tại (sử dụng stancl/tenancy)

        // 2. Tính toán tài chính & thời gian
        $subscription = Subscription::where('tenant_id', $tenant->id)->latest()->first();
        $currentEnd = $subscription ? $subscription->ends_at : null;
        $totalAmount = $plan->price_monthly * $months;
        $startDate = ($currentEnd && $currentEnd->isFuture()) ? $currentEnd : Carbon::now();
        $endDate = $startDate->copy()->addMonths($months);

        // Tạo mã tham chiếu duy nhất để khách hàng nhập vào nội dung chuyển khoản
        // Ví dụ: TS1714201234 (TS + Timestamp)
        $transactionRef = 'TS' . time();

        return DB::connection('mysql')->transaction(function () use ($plan, $tenant, $totalAmount, $startDate, $endDate, $transactionRef, $months) {

            // 3. Cập nhật hoặc tạo mới Subscription (trạng thái chờ)
            $subscription = Subscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'pending', // Hoặc 'inactive' tùy logic của bạn
                    'starts_at' => $startDate,
                    'ends_at' => $endDate,
                ]
            );

            // 4. Lưu vào bảng subscription_payments
            $payment = SubscriptionPayment::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'amount' => $totalAmount,
                'payment_method' => 'sepay_transfer',
                'status' => 'pending',
                'billing_period_start' => $startDate,
                'billing_period_end' => $endDate,
                'transaction_ref' => $transactionRef,
                'note' => "Thanh toán gói {$plan->name} cho {$months} tháng",
            ]);

            // 5. Tạo Link/QR thanh toán SePay (Theo chuẩn VietQR)
            // Bạn thay các thông số cố định này vào file .env hoặc config
            $bankAcc = config('services.sepay.bank_account');
            $bankId = config('services.sepay.bank_id');

            $payUrl = "https://qr.sepay.vn/img?acc={$bankAcc}&bank={$bankId}&amount={$totalAmount}&des={$transactionRef}&template=compact";

            // Trả về dữ liệu để hiển thị trang thanh toán ở Frontend
            return response()->json([
                'success' => true,
                'payment_url' => $payUrl,
                'transaction_ref' => $transactionRef,
                'amount' => $totalAmount,
                'message' => 'Yêu cầu thanh toán đã được tạo.'
            ]);
        });
    }
}
