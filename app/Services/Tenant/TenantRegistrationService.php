<?php

namespace App\Services\Tenant;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Tenant\Staff;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Stancl\Tenancy\Facades\Tenancy;
use Throwable;

class TenantRegistrationService
{
    /**
     * @param  array{tenant_name:string,tenant_phone:?string,tenant_address:?string,slug:string,owner_name:string,owner_email:string,owner_password:string}  $data
     * @return array{tenant:Tenant,login_url:string}
     */
    public function register(array $data): array
    {
        try {
            $tenant = Tenant::create([
                'name' => $data['tenant_name'],
                'slug' => strtolower($data['slug']),
                'phone' => $data['tenant_phone'] ?? null,
                'address' => $data['tenant_address'] ?? null,
                'is_active' => true,
            ]);

            $owner = User::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => $data['owner_password'],
                'role' => UserRole::TenantOwner,
                'phone' => $data['tenant_phone'] ?? null,
                'is_active' => true,
                'tenant_id' => $tenant->id,
            ]);

            Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => 1,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(30),
                'starts_at' => now(),
            ]);

            Tenancy::initialize($tenant);

            Staff::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'phone' => $data['tenant_phone'] ?? null,
                'password' => Hash::make($data['owner_password']),
                'role' => StaffRole::Manager,
                'is_active' => true,
            ]);
        } catch (Throwable $exception) {
            if (isset($owner)) {
                $owner->delete();
            }

            if (isset($tenant)) {
                try {
                    $tenant->delete();
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        } finally {
            if (tenancy()->initialized) {
                Tenancy::end();
            }
        }

        return [
            'tenant' => $tenant,
            'login_url' => route('tenant.login', ['tenant' => $tenant->slug]),
        ];
    }
}

