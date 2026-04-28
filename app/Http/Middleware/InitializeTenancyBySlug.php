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
            ->where('is_active', true)
            ->first();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        $route?->forgetParameter('tenant');
        Tenancy::initialize($tenant);

        return $next($request);
    }
}
