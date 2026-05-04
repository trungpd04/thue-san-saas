<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Co ban',
                'max_fields' => 3,
                'max_staff' => 2,
                'price_monthly' => 200000,
            ],
            [
                'name' => 'Nang cao',
                'max_fields' => 10,
                'max_staff' => 5,
                'price_monthly' => 500000,
            ],
            [
                'name' => 'Premium',
                'max_fields' => 50,
                'max_staff' => 20,
                'price_monthly' => 1000000,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
