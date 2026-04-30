<?php

namespace App\Http\Controllers\Admin\Subscription;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\Subscription\AdminSubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    protected $adminSubscriptionService;

    public function __construct(AdminSubscriptionService $adminSubscriptionService)
    {
        $this->adminSubscriptionService = $adminSubscriptionService;
    }

    /**
     * Hiển thị trang quản lý gói cước cho một Tenant cụ thể
     */
    public function index(String $slug)
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();
        $plans = Plan::where('is_active', true)->get();

        // Lấy gói cước hiện tại của tenant
        $currentSubscription = Subscription::where('tenant_id', $tenant->id)
            ->whereIn('status', ['active', 'trial'])
            ->with('plan')
            ->latest()
            ->first();

        return Inertia::render('Subscription/Index', [
            'plans' => $plans,
            'currentSubscription' => $currentSubscription,
            'tenant' => $tenant,
        ]);
    }

    /**
     * Gán gói cước cho Tenant (gọi Service)
     */
    public function store(Request $request, String $slug)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'months' => 'required|integer|min:1|max:36',
        ]);
        
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        try {
            $this->adminSubscriptionService->assignPlan($tenant, $request->plan_id, $request->months);
            return redirect()->back()->with('success', "Cập nhật gói thành công.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Có lỗi xảy ra: ' . $e->getMessage());
        }
    }

    /**
     * Phê duyệt thanh toán (gọi Service)
     */
    public function approve(Request $request, $paymentId)
    {
        try {
            $this->adminSubscriptionService->approvePayment($paymentId);
            return back()->with('success', 'Thanh toán thành công. Gói dịch vụ đã được kích hoạt.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
