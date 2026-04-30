<?php

declare(strict_types=1);

use App\Http\Controllers\Webhook\SePay\SePayWebhookController;
use Illuminate\Support\Facades\Route;

// Webhook không được có middleware CSRF hoặc Auth
Route::post('/webhooks/sepay', [SePayWebhookController::class, 'handle'])
    ->name('sepay.webhook');