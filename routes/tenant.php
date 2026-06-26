<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\InitializeTenancyBySlug;
use App\Http\Controllers\Tenant\Auth\AuthenticatedTenantSessionController;
use App\Http\Controllers\Tenant\Subscription\SubscriptionController;
use App\Http\Controllers\Tenant\FieldController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\BookingController;
use App\Http\Controllers\Tenant\FieldPriceController;


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
            Route::get('/dashboard', fn() => Inertia::render('Tenant/TenantDashboard'))
                ->middleware(['permission:access_dashboard'])
                ->name('tenant.dashboard');

            Route::resource('fields', FieldController::class)
                ->middleware(['permission:manage_fields'])
                ->names('tenant.fields');

            Route::resource('field-prices', FieldPriceController::class)
                ->middleware(['permission:manage_field_prices'])
                ->names('tenant.field-prices');

            Route::middleware(['permission:manage_bookings'])->group(function () {
                Route::get('/booking', [BookingController::class, 'index'])->name('tenant.booking.index');
                Route::get('/booking/available-slots', [BookingController::class, 'availableSlots'])->name('tenant.booking.available-slots');
                Route::get('/booking/history', [BookingController::class, 'historyPage'])->name('tenant.booking.history');
                Route::get('/booking/history/data', [BookingController::class, 'historyData'])->name('tenant.booking.history-data');
                Route::post('/booking', [BookingController::class, 'store'])->name('tenant.booking.store');
                Route::delete('/booking/{booking}', [BookingController::class, 'destroy'])->name('tenant.booking.destroy');
            });

            Route::get('/customer', [\App\Http\Controllers\Tenant\CustomerController::class, 'index'])
                ->middleware(['permission:manage_customers'])
                ->name('tenant.customer');

            Route::resource('staff', \App\Http\Controllers\Tenant\StaffController::class)
                ->middleware(['role:manager'])
                ->names('tenant.staff');

            // Hồ sơ trung tâm
            Route::middleware(['role:manager'])->group(function () {
                Route::get('/profile', [\App\Http\Controllers\Tenant\ProfileController::class, 'edit'])->name('tenant.profile.edit');
                Route::put('/profile', [\App\Http\Controllers\Tenant\ProfileController::class, 'update'])->name('tenant.profile.update');
            });

        // Trang chọn gói và thanh toán
        Route::get('/subscription/register', [SubscriptionController::class, 'index'])->name('tenant.subscription.index');
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
