<?php

namespace Database\Seeders;

use App\Models\FieldType;
use App\Models\Tenant\FieldPrice;
use Illuminate\Database\Seeder;

class TenantFieldPriceSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['start_time' => '06:00:00', 'end_time' => '18:00:00', 'day_type' => 'weekday', 'price_per_hour' => 150000],
            ['start_time' => '18:00:00', 'end_time' => '23:00:00', 'day_type' => 'weekday', 'price_per_hour' => 200000],
            ['start_time' => '06:00:00', 'end_time' => '23:00:00', 'day_type' => 'weekend', 'price_per_hour' => 250000],
        ];

        foreach (FieldType::query()->pluck('id') as $fieldTypeId) {
            foreach ($rules as $rule) {
                FieldPrice::updateOrCreate(
                    [
                        'field_type_id' => $fieldTypeId,
                        'start_time' => $rule['start_time'],
                        'end_time' => $rule['end_time'],
                        'day_type' => $rule['day_type'],
                    ],
                    ['price_per_hour' => $rule['price_per_hour']]
                );
            }
        }
    }
}
