<?php

namespace App\Http\Controllers\Tenant\SePay;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\Webhook\SePayBookingService;

class SePayWebhookController extends Controller
{
    public function __construct(private readonly SePayBookingService $bookingService)
    {
    }

    /**
     * Handle SePay BankHub Webhook IPN
     */
    public function handleIpn(Request $request)
    {
        $payload = $request->all();

        // Log to a dedicated channel if configured, otherwise default log
        Log::info('SePay Webhook Received:', $payload);

        $webhookSecret = config('services.sepay.webhook_key');
        $headerSecret = $request->header('X-Secret-Key')
            ?? $request->header('x-api-key')
            ?? $request->bearerToken();

        if ($webhookSecret && !hash_equals($webhookSecret, (string) $headerSecret)) {
            Log::warning('SePay BankHub webhook rejected: invalid secret.');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $eventType = $payload['event_type'] ?? null;

        // Event: Bank account linked successfully
        if ($eventType === 'FINISHED_BANK_ACCOUNT_LINK') {
            $companyXid = $payload['data']['company_xid'] ?? null;
            $bankAccountXid = $payload['data']['bank_account_xid'] ?? null;

            // In stancl/tenancy, if the route is under InitializeTenancyBySlug,
            // we already have the current tenant context.
            $tenant = tenant();

            if ($tenant && $tenant->sepay_company_xid === $companyXid) {
                $tenant->update([
                    'has_linked_bank' => true,
                    'sepay_bank_account_xid' => $bankAccountXid,
                ]);
                Log::info("Tenant {$tenant->id} successfully linked bank account.");
                return response()->json(['message' => 'Processed link event']);
            }
        }

        // Event: New transaction (IPN)
        if (in_array($eventType, ['TRANSACTION_NEW', 'TRANSACTION_CREATED', 'BALANCE_CHANGED'], true)) {
            $data = $payload['data'] ?? [];
            $result = $this->bookingService->handle([
                'content' => $data['content'] ?? $data['transaction_content'] ?? $data['description'] ?? '',
                'transferAmount' => $data['amount_in'] ?? $data['amount'] ?? 0,
            ]);

            return response()->json($result);
        }

        return response()->json(['message' => 'Event ignored'], 200);
    }
}
