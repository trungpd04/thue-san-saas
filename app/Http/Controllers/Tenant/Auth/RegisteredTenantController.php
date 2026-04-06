<?php

namespace App\Http\Controllers\Tenant\Auth;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Tenant\Staff;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Stancl\Tenancy\Facades\Tenancy;

class RegisteredTenantController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Tenant/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tenant_name' => ['required', 'string', 'max:255'],
            'tenant_phone' => ['nullable', 'string', 'max:30'],
            'tenant_address' => ['nullable', 'string', 'max:1000'],
            'slug' => ['required', 'string', 'max:63', 'regex:/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i'],

            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'owner_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $baseDomain = (string) config('app.base_domain', env('APP_BASE_DOMAIN', ''));
        $baseDomain = trim($baseDomain);
        if ($baseDomain === '') {
            $host = parse_url(config('app.url'), PHP_URL_HOST);
            $baseDomain = is_string($host) ? $host : '';
        }
        $baseDomain = preg_replace('/^\\.+|\\.+$/', '', $baseDomain ?? '') ?? '';

        $domain = strtolower($validated['slug']).'.'.$baseDomain;

        $tenant = null;

        try {
            $tenant = Tenant::create([
                'name' => $validated['tenant_name'],
                'phone' => $validated['tenant_phone'] ?? null,
                'address' => $validated['tenant_address'] ?? null,
                'is_active' => true,
            ]);

            $tenant->domains()->create(['domain' => $domain]);

            User::create([
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'password' => $validated['owner_password'],
                'role' => UserRole::TenantOwner,
                'phone' => $validated['tenant_phone'] ?? null,
                'is_active' => true,
                'tenant_id' => $tenant->id,
            ]);
        } catch (QueryException $e) {
            if ($tenant) {
                $tenant->delete();
            }

            throw $e;
        }

        Tenancy::initialize($tenant);

        try {
            Staff::create([
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'phone' => $validated['tenant_phone'] ?? null,
                'password' => Hash::make($validated['owner_password']),
                'role' => StaffRole::Manager,
                'is_active' => true,
            ]);
        } finally {
            Tenancy::end();
        }

        $scheme = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'http';
        $loginUrl = $scheme.'://'.$domain.'/tenant/login';

        return redirect()->away($loginUrl);
    }
}

