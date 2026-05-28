<?php

namespace App\Http\Controllers\Tenant\SePay;

use App\Http\Controllers\Controller;
use App\Services\SePayService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\RedirectResponse;

class BankHubController extends Controller
{
    protected SePayService $sePayService;

    public function __construct(SePayService $sePayService)
    {
        $this->sePayService = $sePayService;
    }

    /**
     * Display the SePay BankHub settings page.
     */
    public function settings()
    {
        $tenant = tenant(); // Get current tenant using stancl/tenancy helper
        $bankAccounts = [];

        // 1. If Tenant doesn't have an XID on SePay, create one
        // Note: sepay_company_xid will be stored in the 'data' JSON column of the tenants table
        if (!$tenant->sepay_company_xid) {
            try {
                $xid = $this->sePayService->createCompany($tenant->name);
                if ($xid) {
                    $tenant->update(['sepay_company_xid' => $xid]);
                    Log::info("Created SePay Company XID for tenant {$tenant->id}: {$xid}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to create SePay company: " . $e->getMessage());
            }
        }

        // 2. Get Hosted Link for bank linking via Link Token API
        $hostedLink = null;
        $error = null;
        if ($tenant->sepay_company_xid) {
            try {
                $redirectUri = route('tenant.sepay.settings', ['tenant' => $tenant->slug]);
                $result = $this->sePayService->createLinkToken($tenant->sepay_company_xid, 'LINK_BANK_ACCOUNT', $redirectUri);
                $hostedLink = $result['hosted_link_url'] ?? null;
                $bankAccounts = $this->sePayService->listBankAccounts($tenant->sepay_company_xid);

                if (!empty($bankAccounts)) {
                    $primaryAccount = $bankAccounts[0];
                    $tenant->update([
                        'has_linked_bank' => true,
                        'sepay_bank_account_xid' => $primaryAccount['xid'] ?? null,
                    ]);
                }
            } catch (\Exception $e) {
                $error = $e->getMessage();
                Log::error("Failed to get SePay Link Token: " . $error);
            }
        }

        // 3. Render Inertia React Component
        return Inertia::render('Tenant/SePay/BankHubSettings', [
            'hostedLink' => $hostedLink,
            'isLinked' => (bool) $tenant->has_linked_bank,
            'companyXid' => $tenant->sepay_company_xid,
            'bankAccounts' => $bankAccounts,
            'sandbox' => [
                'enabled' => $this->sePayService->isSandbox(),
                'environment' => $this->sePayService->environment(),
            ],
            'error' => $error
        ]);
    }
}
