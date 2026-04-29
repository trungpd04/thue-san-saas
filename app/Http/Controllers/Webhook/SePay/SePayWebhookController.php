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
        if ($request->header('x-api-key') !== config('services.sepay.webhook_key')) {
            Log::warning('SePay Webhook: Unauthorized access attempt.');
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
