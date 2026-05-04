<?php

declare(strict_types=1);

use App\Http\Controllers\Webhook\SePay\SePayWebhookController;
use App\Http\Controllers\Webhook\SePay\SePayBookingWebhookController;
use Illuminate\Support\Facades\Route;

// Webhook không được có middleware CSRF hoặc Auth
Route::post('/webhooks/sepay', [SePayWebhookController::class, 'handle'])
    ->name('sepay.webhook');

Route::post('/webhooks/sepay/booking', [SePayBookingWebhookController::class, 'handle'])
    ->name('sepay.booking.webhook');