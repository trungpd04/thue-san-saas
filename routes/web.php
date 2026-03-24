<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/admin/dashboard');


/**
 * Admin Routes
 */

Route::get('/admin/dashboard', function () {
    return Inertia::render('AdminDashboard');
})->name('admin.dashboard');


Route::get('/admin/tenant', function () {
    return Inertia::render('Tenant');
})->name('admin.tenant');  


/**
 * Tenant Routes
 */

Route::get('/tenant/dashboard', function () {
    return Inertia::render('TenantDashboard');
})->name('tenant.dashboard');

Route::get('/tenant/customer', function () {
    return Inertia::render('Customer');
})->name('tenant.customer');

Route::get('/tenant/booking', function () {
    return Inertia::render('Booking');
})->name('tenant.booking');

Route::get('/tenant/court', function () {
    return Inertia::render('Court');
})->name('tenant.court');

Route::get('/tenant/sport', function () {
    return Inertia::render('Sport');
})->name('tenant.sport');