<?php

namespace Database\Seeders;

use App\Models\Tenant\TimeSlot;
use Illuminate\Database\Seeder;

class TenantTimeSlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            ['name' => 'Sang som', 'start_time' => '06:00', 'end_time' => '08:00'],
            ['name' => 'Sang', 'start_time' => '08:00', 'end_time' => '10:00'],
            ['name' => 'Trua', 'start_time' => '10:00', 'end_time' => '12:00'],
            ['name' => 'Chieu', 'start_time' => '14:00', 'end_time' => '16:00'],
            ['name' => 'Chieu toi', 'start_time' => '16:00', 'end_time' => '18:00'],
            ['name' => 'Gio vang', 'start_time' => '18:00', 'end_time' => '20:00'],
            ['name' => 'Toi', 'start_time' => '20:00', 'end_time' => '22:00'],
        ];

        foreach ($slots as $slot) {
            TimeSlot::updateOrCreate(['name' => $slot['name']], $slot);
        }
    }
}
