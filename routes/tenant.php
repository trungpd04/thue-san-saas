<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\InitializeTenancyBySlug;
use App\Http\Controllers\Tenant\Auth\AuthenticatedTenantSessionController;
use App\Http\Controllers\Tenant\Auth\RegisteredTenantController;
use App\Http\Controllers\Tenant\SubscriptionRegistrationController;

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

    Route::post('/logout', [AuthenticatedTenantSessionController::class, 'destroy'])
        ->middleware('auth:tenant')
        ->name('tenant.logout');

    Route::middleware('auth:tenant')->group(function () {
        Route::get('/dashboard', fn() => Inertia::render('Tenant/TenantDashboard'))->name('tenant.dashboard');

        // Trang chọn gói và thanh toán
        Route::get('/subscription/register', [SubscriptionRegistrationController::class, 'index'])->name('tenant.subscription.index');

        // Xử lý đăng ký (Đã có method register trong controller của bạn)
        Route::post('/subscription/register', [SubscriptionRegistrationController::class, 'register'])->name('tenant.subscription.register');

        // Trang xem lịch sử/trạng thái thanh toán
        Route::get('/subscription/status', [SubscriptionRegistrationController::class, 'status'])->name('tenant.subscription.status');
    });
});
