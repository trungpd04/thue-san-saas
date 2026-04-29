<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
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
     * Gán gói cước cho Tenant
     */
    public function store(Request $request, String $slug)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'months' => 'required|integer|min:1|max:36',
        ]);
        
        $tenant = Tenant::where('slug', $slug)->firstOrFail();
        $plan = Plan::findOrFail($request->plan_id);
        $months = (int) $request->months;

        try {
            DB::beginTransaction();

            // Đưa các gói cũ về trạng thái expired
            Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->update(['status' => 'expired', 'ends_at' => now()]);

            // Tạo gói đăng ký mới
            Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addMonths($months),
            ]);

            DB::commit();
            return redirect()->back()->with('success', "Đã gán gói {$plan->name} ({$months} tháng) cho tenant thành công.");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi gán gói cước: ' . $e->getMessage());
        }
    }

    public function approve(Request $request, $paymentId)
    {
        $payment = SubscriptionPayment::findOrFail($paymentId);

        if ($payment->status === 'success') {
            return back()->with('error', 'Giao dịch này đã được xử lý trước đó.');
        }

        DB::transaction(function () use ($payment) {
            // 1. Cập nhật trạng thái thanh toán
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'note' => $payment->note . " | Admin xác nhận lúc: " . now(),
            ]);

            // 2. Kích hoạt Subscription tương ứng
            $subscription = $payment->subscription;
            $subscription->update([
                'status' => 'active',
                // Có thể cập nhật lại ngày bắt đầu từ lúc Admin duyệt nếu muốn
                // 'starts_at' => now(), 
                // 'ends_at' => now()->addMonths($months_count),
            ]);
        });

        return back()->with('success', 'Thanh toán thành công. Gói dịch vụ đã được kích hoạt.');
    }
}
