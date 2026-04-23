<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use Inertia\Inertia;
use App\Http\Controllers\Tenant\Auth\AuthenticatedTenantSessionController;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    Route::middleware('guest:tenant')->prefix('tenant')->group(function () {
        Route::get('/login', [AuthenticatedTenantSessionController::class, 'create'])->name('tenant.login');
        Route::post('/login', [AuthenticatedTenantSessionController::class, 'store'])->middleware('throttle:10,1');
    });

    Route::post('/tenant/logout', [AuthenticatedTenantSessionController::class, 'destroy'])
        ->middleware('auth:tenant')
        ->name('tenant.logout');

    Route::middleware('auth:tenant')->prefix('tenant')->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Tenant/TenantDashboard'))->name('tenant.dashboard');
    });
});
