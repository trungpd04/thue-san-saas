<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Hiển thị trang quản lý gói cước cho một Tenant cụ thể
     */
    public function index(Tenant $tenant)
    {
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
    public function store(Request $request, Tenant $tenant)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

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
                'ends_at' => now()->addMonth(),
            ]);

            DB::commit();
            return redirect()->back()->with('success', "Đã gán gói {$plan->name} cho tenant thành công.");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi gán gói cước: ' . $e->getMessage());
        }
    }
}
