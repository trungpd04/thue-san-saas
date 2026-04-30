<?php

use App\Http\Controllers\Admin\AuthenticatedSessionController;
use App\Http\Controllers\Tenant\Auth\RegisteredTenantController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\PublicFieldController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/admin/dashboard');

Route::get('/san', [PublicFieldController::class, 'index'])->name('public.fields.index');
Route::get('/san/{field}/bookings', [PublicFieldController::class, 'bookings'])->name('public.fields.bookings');
Route::get('/san/tenant/{tenant_id}/bookings', [PublicFieldController::class, 'tenantBookings'])->name('public.fields.tenantBookings');
Route::get('/san/tenant/{tenant_id}/available-slots', [PublicFieldController::class, 'availableSlots'])->name('public.fields.availableSlots');
Route::get('/san/tenant/{tenant_id}/booking', [PublicFieldController::class, 'showBookingPage'])->name('public.fields.bookingPage');
Route::post('/san/tenant/{tenant_id}/public-book', [PublicFieldController::class, 'storeBooking'])->name('public.fields.storeBooking');
Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
    Route::post('/admin/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:5,1');

    Route::get('/register', [RegisteredTenantController::class, 'create'])->name('tenant.register');
    Route::post('/register', [RegisteredTenantController::class, 'store'])->middleware('throttle:10,1');
});

Route::post('/admin/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('admin.logout');

Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('AdminDashboard');
    })->name('admin.dashboard');

    Route::get('/tenant', function () {
        return Inertia::render('Tenant');
    })->name('admin.tenant');
    Route::resource('plans', PlanController::class)->except(['create', 'show', 'edit']);

    require __DIR__ . '/subscription.php';
});
