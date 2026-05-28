<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Facades\Tenancy;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancyBySlug
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        $slug = $route?->parameter('tenant');

        if (! is_string($slug) || $slug === '') {
            abort(404, 'Tenant not found.');
        }

        $tenant = Tenant::query()
            ->where('slug', strtolower($slug))
            ->first();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        $route?->forgetParameter('tenant');
        Tenancy::initialize($tenant);

        if (! $tenant->is_active && ! $request->is("tenant/{$tenant->slug}/login")) {
            auth('tenant')->logout();

            return redirect()
                ->route('tenant.login', ['tenant' => $tenant->slug])
                ->withErrors([
                    'email' => 'Chủ sân đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.',
                ]);
        }

        return $next($request);
    }
}
