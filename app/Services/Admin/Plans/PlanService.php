<?php

namespace App\Services\Admin\Plans;

use App\Models\Plan;
use Illuminate\Support\Collection;
use App\Factories\Admin\PlanFactory;

class PlanService
{
    public function getAllPlans(): Collection
    {
        return Plan::orderBy('created_at', 'desc')->get();
    }

    public function createPlan(array $data): Plan
    {
        // Nhờ Factory chế tạo đối tượng Plan
        $plan = PlanFactory::make($data);
        
        // Service chỉ lo việc lưu xuống Database
        $plan->save();

        return $plan;
    }

    public function updatePlan(Plan $plan, array $data): bool
    {
        return $plan->update($data);
    }

    public function disablePlan(Plan $plan): bool
    {
        return $plan->update(['is_active' => false]);
    }
}