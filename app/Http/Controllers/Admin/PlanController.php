<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class PlanController extends Controller
{
    /**
     * Hiển thị danh sách các gói dịch vụ (Plans) cho Super Admin.
     */
   public function index()
    {
        $plans = Plan::orderBy('created_at', 'desc')->get();

        // Trả về thư mục Plans mới tạo
        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans
        ]);
    }

    /**
     * Lưu một gói dịch vụ mới vào hệ thống mẹ.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'max_fields' => 'required|integer|min:1',
            'max_staff' => 'required|integer|min:1',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        Plan::create($validated);

        return back()->with('success', 'Đã tạo gói dịch vụ mới thành công!');
    }

    /**
     * Cập nhật thông tin gói dịch vụ hiện có.
     */
    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'max_fields' => 'required|integer|min:1',
            'max_staff' => 'required|integer|min:1',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return back()->with('success', 'Thông tin gói dịch vụ đã được cập nhật!');
    }

    /**
     * Vô hiệu hóa gói dịch vụ thay vì xóa cứng.
     * Điều này giúp bảo toàn dữ liệu cho các Tenant đang đăng ký gói này.
     */
    public function destroy(Plan $plan): RedirectResponse
    {
        $plan->update(['is_active' => false]);

        return back()->with('success', 'Gói dịch vụ đã được chuyển sang trạng thái ngưng hoạt động.');
    }
}