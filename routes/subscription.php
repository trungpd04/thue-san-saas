<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\SubscriptionController;
use Illuminate\Support\Facades\Route;

// Sử dụng {tenant} để Laravel tự động tìm kiếm Tenant theo ID
Route::prefix('tenant/{tenant}/subscription')->name('admin.tenant.subscription.')->group(function () {     
    Route::get('/', [SubscriptionController::class, 'index'])->name('index');
    Route::post('/', [SubscriptionController::class, 'store'])->name('store');
});
