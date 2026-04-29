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


        return DB::connection('mysql')->transaction(function () use ($plan, $tenant, $months) {
            $totalAmount = $plan->price_monthly * $months;

            // 3. Cập nhật hoặc tạo mới Subscription (trạng thái chờ)
            $subscription = Subscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'pending', 
                ]
            );

            // 4. Lưu vào bảng subscription_payments
            $payment = SubscriptionPayment::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'amount' => $totalAmount,
                'payment_method' => 'sepay_transfer',
                'status' => 'pending',
                'note' => "Thanh toán gói {$plan->name} cho {$months} tháng",
                'billing_period_start' => Carbon::now(),
                'billing_period_end' => Carbon::now()->addMonths($months),
            ]);
            $transactionRef = 'TS' . str_pad($payment->id, 6, '0', STR_PAD_LEFT);
            $payment->update(['transaction_ref' => $transactionRef]);
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
    public function checkStatus(string $ref)
    {
        $payment = SubscriptionPayment::where('transaction_ref', $ref)->first();
        return response()->json(['status' => $payment?->status]);
    }

    /**
     * Trang hiển thị thông tin thanh toán SePay
     */
    public function sepayPayment(Request $request)
    {
        $transactionRef = $request->query('ref');
        $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)->first();

        if (!$payment) {
            return redirect()->route('tenant.subscription.index')->with('error', 'Không tìm thấy thông tin thanh toán');
        }

        return \Inertia\Inertia::render('Tenant/Subscription/SepayPayment', [
            'payment' => $payment->load('subscription.plan'),
            'transaction_ref' => $transactionRef,
        ]);
    }
}
