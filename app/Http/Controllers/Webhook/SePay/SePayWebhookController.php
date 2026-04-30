<?php

namespace App\Http\Controllers\Webhook\SePay;

use App\Http\Controllers\Controller;
use App\Services\Webhook\SePayWebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SePayWebhookController extends Controller
{
    protected $sePayWebhookService;

    public function __construct(SePayWebhookService $sePayWebhookService)
    {
        $this->sePayWebhookService = $sePayWebhookService;
    }

    /**
     * Tiếp nhận webhook từ SePay (gọi Service)
     */
    public function handle(Request $request)
    {
        Log::info('SePay Webhook Received:', $request->all());

        // 1. Xác thực API Key
        $webhookToken = config('services.sepay.webhook_key');
        $headerKey = $request->header('x-api-key');
        $authHeader = $request->header('Authorization');

        // Nếu có Authorization header (dạng "Apikey ..." hoặc "Bearer ...")
        if ($authHeader && preg_match('/(?:Apikey|Bearer)\s+(.*)$/i', $authHeader, $matches)) {
            $headerKey = $matches[1];
        }

        if ($headerKey !== $webhookToken) {
            Log::warning('SePay Webhook: Unauthorized access attempt. Received: ' . ($headerKey ?? 'none'));
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $result = $this->sePayWebhookService->handle($request->all());
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error("SePay Webhook Controller Error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
