<?php

namespace Database\Seeders;

use App\Models\FieldType;
use Illuminate\Database\Seeder;

class FieldTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'San bong da 5 nguoi', 'sport' => 'football'],
            ['name' => 'San bong da 7 nguoi', 'sport' => 'football'],
            ['name' => 'San bong da 11 nguoi', 'sport' => 'football'],
            ['name' => 'San cau long', 'sport' => 'badminton'],
            ['name' => 'San tennis', 'sport' => 'tennis'],
            ['name' => 'San pickleball', 'sport' => 'pickleball'],
        ];

        foreach ($types as $type) {
            FieldType::updateOrCreate(['name' => $type['name']], $type);
        }
    }
}
