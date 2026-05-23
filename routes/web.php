<?php

use App\Http\Controllers\Admin\AuthenticatedSessionController;
use App\Http\Controllers\Tenant\Auth\RegisteredTenantController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaymentHistoryController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\PublicFieldController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SaasLandingController;

Route::redirect('/', '/admin/dashboard');
Route::redirect('/admin', '/admin/dashboard');

Route::get('/san', [PublicFieldController::class, 'index'])->name('public.fields.index');
Route::get('/san/{field}/bookings', [PublicFieldController::class, 'bookings'])->name('public.fields.bookings');
// Route::get('/san/tenant/{tenant_id}/bookings', [PublicFieldController::class, 'tenantBookings'])->name('public.fields.tenantBookings');
Route::get('/san/tenant/{tenant_id}/available-slots', [PublicFieldController::class, 'availableSlots'])->name('public.fields.availableSlots');
Route::get('/san/tenant/{tenant_id}/booking', [PublicFieldController::class, 'showBookingPage'])->name('public.fields.bookingPage');
Route::post('/san/tenant/{tenant_id}/public-book', [PublicFieldController::class, 'storeBooking'])->name('public.fields.storeBooking');
Route::get('/san/checkout', [PublicFieldController::class, 'checkout'])->name('public.fields.checkout');
Route::get('/san/booking-status', [PublicFieldController::class, 'checkPaymentStatus'])->name('public.fields.checkStatus');
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
   Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');

    Route::get('/tenant-management', [TenantController::class, 'index'])->name('admin.tenants.index');
    Route::patch('/tenant-management/{tenant}/status', [TenantController::class, 'updateStatus'])->name('admin.tenants.status');
    Route::get('/payment-history', [PaymentHistoryController::class, 'index'])->name('admin.payment-history.index');
    Route::resource('plans', PlanController::class)->except(['create', 'show', 'edit']);

    require __DIR__ . '/subscription.php';
});

// Định tuyến hiển thị trang chủ giới thiệu phần mềm SaaS (Hiển thị bảng giá dịch vụ)
Route::get('/', [SaasLandingController::class, 'index'])->name('saas.landing');

// Định tuyến tiếp nhận thông tin khi khách hàng gửi Form đăng ký mở bãi sân mới
Route::post('/register-tenant', [SaasLandingController::class, 'registerTenant'])->name('saas.register_tenant');