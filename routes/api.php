<?php

declare(strict_types=1);

use App\Http\Controllers\Webhook\SePay\SePayWebhookController;
use App\Http\Controllers\Webhook\SePay\SePayBookingWebhookController;
use App\Http\Controllers\Webhook\SePay\SePayBankHubWebhookController;
use Illuminate\Support\Facades\Route;

// Webhook không được có middleware CSRF hoặc Auth
Route::post('/webhooks/sepay', [SePayWebhookController::class, 'handle'])
    ->name('sepay.webhook');

Route::post('/webhooks/sepay/booking', [SePayBookingWebhookController::class, 'handle'])
    ->name('sepay.booking.webhook');

Route::post('/webhooks/sepay/bankhub', [SePayBankHubWebhookController::class, 'handle'])
    ->name('sepay.bankhub.webhook');
