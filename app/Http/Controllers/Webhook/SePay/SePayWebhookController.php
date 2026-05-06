<?php

namespace App\Http\Controllers\Webhook\SePay;

use App\Http\Controllers\Controller;
use App\Services\Subscription\PaymentManager;
use App\Services\Subscription\Strategies\SepayStrategy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SePayWebhookController extends Controller
{
    protected $paymentManager;

    public function __construct(PaymentManager $paymentManager)
    {
        $this->paymentManager = $paymentManager;
    }

    /**
     * Tiếp nhận webhook từ SePay (gọi PaymentManager với SepayStrategy)
     */
    public function handle(Request $request)
    {
        Log::info('SePay Webhook Received:', $request->all());

        // 1. Xác thực API Key
        $webhookToken = config('services.sepay.webhook_key');
        $headerKey = $request->header('x-api-key');
        $authHeader = $request->header('Authorization');

        if ($authHeader && preg_match('/(?:Apikey|Bearer)\s+(.*)$/i', $authHeader, $matches)) {
            $headerKey = $matches[1];
        }

        if ($headerKey !== $webhookToken) {
            Log::warning('SePay Webhook: Unauthorized access attempt.');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            // Sử dụng PaymentManager với SepayStrategy
            $result = $this->paymentManager
                ->setStrategy(app(SepayStrategy::class))
                ->handleWebhook($request->all());

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error("SePay Webhook Controller Error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
