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
        $plans = Plan::where('is_active', true)->get();
        $tenant = tenant();

        // Lấy subscription hiện tại
        $currentSubscription = Subscription::where('tenant_id', $tenant->id)
            ->with('plan')
            ->first();

        return Inertia::render('Tenant/Subscription/Register', [
            'plans' => $plans,
            'currentSubscription' => $currentSubscription
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
        ]);

        $result = $this->subscriptionService->register(
            tenant(),
            $request->plan_id,
            $request->months
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
        $transactionRef = $request->query('ref');
        $payment = SubscriptionPayment::where('transaction_ref', $transactionRef)->first();

        if (!$payment) {
            return redirect()->route('tenant.subscription.index')->with('error', 'Không tìm thấy thông tin thanh toán');
        }

        return Inertia::render('Tenant/Subscription/SepayPayment', [
            'payment' => $payment->load('subscription.plan'),
            'transaction_ref' => $transactionRef,
        ]);
    }
}
