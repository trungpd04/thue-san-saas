<?php

namespace App\Services\Tenant;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\Tenant\Staff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Stancl\Tenancy\Facades\Tenancy;

class TenantRegistrationService
{
    /**
     * @param  array{tenant_name:string,tenant_phone:?string,tenant_address:?string,slug:string,owner_name:string,owner_email:string,owner_password:string}  $data
     * @return array{tenant:Tenant,domain:string,login_url:string}
     */
    public function register(array $data): array
    {
        $baseDomain = $this->resolveBaseDomain();
        $domain = strtolower($data['slug']).'.'.$baseDomain;

        /** @var array{tenant:Tenant,domain:string} $created */
        $created = DB::transaction(function () use ($data, $domain) {
            $tenant = Tenant::create([
                'name' => $data['tenant_name'],
                'phone' => $data['tenant_phone'] ?? null,
                'address' => $data['tenant_address'] ?? null,
                'is_active' => true,
            ]);

            $tenant->domains()->create(['domain' => $domain]);

            User::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => $data['owner_password'],
                'role' => UserRole::TenantOwner,
                'phone' => $data['tenant_phone'] ?? null,
                'is_active' => true,
                'tenant_id' => $tenant->id,
            ]);

            return ['tenant' => $tenant, 'domain' => $domain];
        });

        $tenant = $created['tenant'];

        Tenancy::initialize($tenant);
        try {
            Staff::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'phone' => $data['tenant_phone'] ?? null,
                'password' => Hash::make($data['owner_password']),
                'role' => StaffRole::Manager,
                'is_active' => true,
            ]);
        } finally {
            Tenancy::end();
        }

        $scheme = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'http';
        $loginUrl = $scheme.'://'.$domain.'/tenant/login';

        return [
            'tenant' => $tenant,
            'domain' => $domain,
            'login_url' => $loginUrl,
        ];
    }

    private function resolveBaseDomain(): string
    {
        $baseDomain = (string) config('app.base_domain', env('APP_BASE_DOMAIN', ''));
        $baseDomain = trim($baseDomain);

        if ($baseDomain === '') {
            $host = parse_url(config('app.url'), PHP_URL_HOST);
            $baseDomain = is_string($host) ? $host : '';
        }

        $baseDomain = preg_replace('/^\\.+|\\.+$/', '', $baseDomain ?? '') ?? '';

        return $baseDomain;
    }
}

