<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\InitializeTenancyBySlug;
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

Route::middleware([InitializeTenancyBySlug::class])
    ->group(function () {
        Route::middleware('guest:tenant')->group(function () {
            Route::get('/login', [AuthenticatedTenantSessionController::class, 'create'])
                ->name('tenant.login');
            Route::post('/login', [AuthenticatedTenantSessionController::class, 'store'])
                ->middleware('throttle:10,1');
        });

        Route::middleware('auth:tenant')->group(function () {
            Route::post('/logout', [AuthenticatedTenantSessionController::class, 'destroy'])
                ->name('tenant.logout');
            Route::get('/dashboard', fn () => Inertia::render('Tenant/TenantDashboard'))
                ->name('tenant.dashboard');
        });
    });
