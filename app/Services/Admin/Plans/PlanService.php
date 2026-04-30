<?php

namespace App\Services\Admin\Plans;

use App\Models\Plan;
use Illuminate\Support\Collection;

class PlanService
{
    public function getAllPlans(): Collection
    {
        return Plan::orderBy('created_at', 'desc')->get();
    }

    public function createPlan(array $data): Plan
    {
        return Plan::create($data);
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