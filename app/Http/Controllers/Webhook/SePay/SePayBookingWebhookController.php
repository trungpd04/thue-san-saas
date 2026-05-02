<?php

namespace App\Http\Controllers\Webhook\SePay;

use App\Http\Controllers\Controller;
use App\Services\Webhook\SePayBookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SePayBookingWebhookController extends Controller
{
    protected $sePayBookingService;

    public function __construct(SePayBookingService $sePayBookingService)
    {
        $this->sePayBookingService = $sePayBookingService;
    }

    /**
     * Tiếp nhận webhook thanh toán đặt sân từ SePay
     */
    public function handle(Request $request)
    {
        Log::info('SePay Booking Webhook Received:', $request->all());

        // 1. Xác thực API Key
        $webhookToken = config('services.sepay.webhook_key');
        $headerKey = $request->header('x-api-key');
        $authHeader = $request->header('Authorization');

        // Nếu có Authorization header
        if ($authHeader && preg_match('/(?:Apikey|Bearer)\s+(.*)$/i', $authHeader, $matches)) {
            $headerKey = $matches[1];
        }

        if ($headerKey !== $webhookToken) {
            Log::warning('SePay Booking Webhook: Unauthorized access attempt.');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $result = $this->sePayBookingService->handle($request->all());
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error("SePay Booking Webhook Controller Error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
