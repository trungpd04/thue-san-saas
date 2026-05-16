<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\InitializeTenancyBySlug;
use App\Http\Controllers\Tenant\Auth\AuthenticatedTenantSessionController;
use App\Http\Controllers\Tenant\Auth\RegisteredTenantController;
use App\Http\Controllers\Tenant\Subscription\SubscriptionController;
use App\Http\Controllers\Tenant\FieldController;


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
            Route::resource('fields', FieldController::class)->names('tenant.fields');
            Route::resource('field-prices', FieldPriceController::class)->names('tenant.field-prices');
            Route::get('/booking', [BookingController::class, 'index'])->name('tenant.booking.index');
            Route::get('/booking/available-slots', [BookingController::class, 'availableSlots'])->name('tenant.booking.available-slots');
            Route::get('/booking/history', [BookingController::class, 'history'])->name('tenant.booking.history');
            Route::post('/booking', [BookingController::class, 'store'])->name('tenant.booking.store');
            Route::delete('/booking/{booking}', [BookingController::class, 'destroy'])->name('tenant.booking.destroy');

            // Trang chọn gói và thanh toán
            Route::get('/subscription/register', [SubscriptionController::class, 'index'])->name('tenant.subscription.index');

            // Xử lý đăng ký
            Route::post('/subscription/register', [SubscriptionController::class, 'register'])->name('tenant.subscription.register');

            // Trang xem lịch sử/trạng thái thanh toán
            Route::get('/subscription/status', [SubscriptionController::class, 'status'])->name('tenant.subscription.status');
            Route::get('/subscription/check-status/{ref}', [SubscriptionController::class, 'checkStatus'])->name('tenant.subscription.check-status');
            Route::get('/subscription/sepay-payment', [SubscriptionController::class, 'sepayPayment'])->name('tenant.subscription.sepay-payment');
            Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])->name('tenant.subscription.cancel');

            // SePay BankHub Integration for Stadium Owners
            Route::prefix('sepay')->name('tenant.sepay.')->group(function () {
                Route::get('/settings', [\App\Http\Controllers\Tenant\SePay\BankHubController::class, 'settings'])->name('settings');
            });
        });

    });
