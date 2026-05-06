<?php

namespace App\Http\Controllers\Tenant\Subscription;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Services\Subscription\TenantSubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    protected $subscriptionService;

    public function __construct(TenantSubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Trang chọn gói dịch vụ
     */
    public function index()
    {
        $tenant = tenant();
        $this->subscriptionService->cleanupExpiredPayments($tenant->id);

        $plans = Plan::where('is_active', true)->get();

        // Lấy subscription đang active
        $activeSubscription = Subscription::where('tenant_id', $tenant->id)
            ->whereIn('status', ['active', 'trial'])
            ->with('plan')
            ->first();

        // Lấy subscription đang chờ thanh toán (nếu có)
        $pendingSubscription = Subscription::where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->with(['plan', 'payments' => function ($query) {
                $query->where('status', 'pending')->latest();
            }])
            ->latest()
            ->first();

        return Inertia::render('Tenant/Subscription/Register', [
            'plans' => $plans,
            'activeSubscription' => $activeSubscription,
            'pendingSubscription' => $pendingSubscription,
            // Giữ lại currentSubscription cho các thành phần cũ nếu cần (ưu tiên pending)
            'currentSubscription' => $pendingSubscription ?? $activeSubscription
        ]);
    }

    /**
     * Trang xem lịch sử/trạng thái thanh toán
     */
    public function status()
    {
        $tenant = tenant();
        $payments = SubscriptionPayment::where('tenant_id', $tenant->id)
            ->with('subscription.plan')
            ->latest()
            ->get();

        return Inertia::render('Tenant/Subscription/Status', [
            'payments' => $payments
        ]);
    }

    /**
     * Xử lý tạo yêu cầu đăng ký gói (gọi Service)
     */
    public function register(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'months' => 'required|integer|min:1|max:36',
            'method' => 'sometimes|string|in:sepay,momo',
        ]);

        $result = $this->subscriptionService->register(
            tenant(),
            $request->plan_id,
            $request->months,
            $request->input('method', 'sepay')
        );

        return response()->json($result);
    }

    /**
     * Kiểm tra trạng thái thanh toán (gọi Service)
     */
    public function checkStatus(string $ref)
    {
        $status = $this->subscriptionService->checkStatus($ref);
        return response()->json(['status' => $status]);
    }

    /**
     * Trang hiển thị thông tin thanh toán SePay
     */
    public function sepayPayment(Request $request)
    {
        $tenant = tenant();
        $this->subscriptionService->cleanupExpiredPayments($tenant->id);

        $transactionRef = $request->query('ref');
        $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)->first();

        // if (!$payment) {
        //     return redirect()->route('tenant.subscription.index')->with('error', 'Thông tin thanh toán không tồn tại hoặc đã hết hạn');
        // }
        // Sửa tại hàm sepayPayment hoặc bất kỳ chỗ nào có redirect
        if (!$payment) {
            return redirect()->route('tenant.subscription.index', ['tenant' => tenant('slug')])
                ->with('error', 'Thông tin thanh toán không tồn tại hoặc đã hết hạn');
        }

        return Inertia::render('Tenant/Subscription/SepayPayment', [
            'payment' => $payment->load('subscription.plan'),
            'transaction_ref' => $transactionRef,
            'sepay_config' => [
                'bank_account' => config('services.sepay.bank_account'),
                'bank_id' => config('services.sepay.bank_id'),
            ]
        ]);
    }
    public function cancel(Request $request){
        $ref = $request->query('ref');
        $success = $this->subscriptionService->cancelPendingPayment($ref);
        return response()->json(['success' => $success]);
    }
}
