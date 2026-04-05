<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@thuesan.vn'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
                'role' => UserRole::Admin,
                'is_active' => true,
            ]
        );
    }
}
