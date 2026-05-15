<?php

namespace App\Http\Controllers\Webhook\SePay;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Webhook\SePayBookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SePayBankHubWebhookController extends Controller
{
    public function __construct(private readonly SePayBookingService $bookingService)
    {
    }

    public function handle(Request $request)
    {
        $payload = $request->all();

        Log::info('SePay Bank Hub webhook received:', $payload);

        $webhookSecret = config('services.sepay.webhook_key');
        $receivedSecret = $request->header('X-Secret-Key')
            ?? $request->header('x-api-key')
            ?? $request->bearerToken();

        if ($webhookSecret && !hash_equals($webhookSecret, (string) $receivedSecret)) {
            Log::warning('SePay Bank Hub webhook rejected: invalid secret.');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $eventType = $payload['event_type'] ?? $payload['event'] ?? null;
        $data = $payload['data'] ?? $payload;
        $companyXid = $data['company_xid'] ?? $payload['company_xid'] ?? null;

        if ($companyXid) {
            $tenant = Tenant::where('data->sepay_company_xid', $companyXid)->first();

            if ($tenant && in_array($eventType, ['BANK_ACCOUNT_LINKED', 'FINISHED_BANK_ACCOUNT_LINK', 'LINK_SESSION_COMPLETED'], true)) {
                $tenant->update([
                    'has_linked_bank' => true,
                    'sepay_bank_account_xid' => $data['bank_account_xid'] ?? $data['xid'] ?? $tenant->sepay_bank_account_xid,
                ]);

                return response()->json(['message' => 'Bank account link event processed']);
            }
        }

        $result = $this->bookingService->handle([
            'content' => $data['content'] ?? $data['transaction_content'] ?? $data['description'] ?? '',
            'transferAmount' => $data['amount_in'] ?? $data['amount'] ?? 0,
            'transaction_id' => $data['transaction_id'] ?? $data['id'] ?? null,
        ]);

        return response()->json($result);
    }
}
