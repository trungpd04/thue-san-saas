<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\Admin\Plans\PlanService;
use App\Http\Requests\Admin\StorePlanRequest;  // <-- Import Request Thêm
use App\Http\Requests\Admin\UpdatePlanRequest; // <-- Import Request Sửa
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class PlanController extends Controller
{
    protected $planService;

    public function __construct(PlanService $planService)
    {
        $this->planService = $planService;
    }

    public function index()
    {
        return Inertia::render('Admin/Plans/Index', [
            'plans' => $this->planService->getAllPlans()
        ]);
    }

    // Tiêm StorePlanRequest vào đây để Laravel tự động validate
    public function store(StorePlanRequest $request): RedirectResponse
    {
        // $request->validated() chỉ lấy ra những trường đã pass qua Rules
        $this->planService->createPlan($request->validated());

        return back()->with('success', 'Tạo gói thành công!');
    }

    // Tiêm UpdatePlanRequest vào đây
    public function update(UpdatePlanRequest $request, Plan $plan): RedirectResponse
    {
        $this->planService->updatePlan($plan, $request->validated());

        return back()->with('success', 'Cập nhật thành công!');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        $this->planService->disablePlan($plan);

        return back()->with('success', 'Đã vô hiệu hóa gói!');
    }
}