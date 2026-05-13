<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SePayService
{
    protected string $baseUrl;
    protected string $environment;

    public function __construct()
    {
        $this->baseUrl = config('services.sepay.api_url', env('SEPAY_API_URL', 'https://bankhub-api-sandbox.sepay.vn/v1'));
        $this->environment = config('services.sepay.bankhub_env', 'sandbox');
    }

    public function isSandbox(): bool
    {
        return $this->environment === 'sandbox' && str_contains($this->baseUrl, 'sandbox');
    }

    public function environment(): string
    {
        return $this->environment;
    }

    protected function ensureSandbox(): void
    {
        if (!$this->isSandbox()) {
            throw new \RuntimeException('SePay Bank Hub is only enabled in sandbox/dev mode.');
        }
    }

    /**
     * Get access token from SePay and cache it.
     */
    public function getToken(): string
    {
        $this->ensureSandbox();

        return Cache::remember("sepay_bankhub_{$this->environment}_access_token", 3500, function () {
            $clientId = config('services.sepay.client_id', env('SEPAY_CLIENT_ID'));
            $clientSecret = config('services.sepay.client_secret', env('SEPAY_CLIENT_SECRET'));

            if (!$clientId || !$clientSecret) {
                throw new \RuntimeException('Missing SePay Bank Hub sandbox credentials.');
            }

            $request = Http::withBasicAuth($clientId, $clientSecret);

            if (app()->environment('local')) {
                $request->withoutVerifying();
            }

            $response = $request->post("{$this->baseUrl}/token");

            if ($response->failed()) {
                Log::error('SePay BankHub Token Error: ' . $response->body());
                throw new \Exception('Không thể lấy Token từ SePay Bank Hub');
            }

            return $response->json('access_token');
        });
    }

    /**
     * Helper to create a request with Bearer Token.
     */
    protected function api()
    {
        $this->ensureSandbox();

        $request = Http::withToken($this->getToken())->baseUrl($this->baseUrl);

        // Workaround for local development SSL issues (cURL error 60)
        if (app()->environment('local')) {
            $request->withoutVerifying();
        }

        return $request;
    }

    /**
     * Create a Company (for Stadium Owner/Tenant) in SePay.
     */
    public function createCompany(string $tenantName): ?string
    {
        $response = $this->api()->post('/company/create', [
            'full_name' => $tenantName,
            'status' => 'Active',
        ]);

        if ($response->failed()) {
            Log::error('SePay Create Company Error: ' . $response->body());
            return null;
        }

        return $response->json('data.xid');
    }

    /**
     * Create a link token to link a bank account.
     * Endpoint: /v1/link-token/create
     */
    public function createLinkToken(
        string $companyXid,
        string $purpose = 'LINK_BANK_ACCOUNT',
        ?string $redirectUri = null
    ): array {
        $payload = [
            'company_xid' => $companyXid,
            'purpose' => $purpose,
            'is_mobile_app' => 0,
            'language' => 'vi',
        ];

        if ($redirectUri) {
            $payload['completion_redirect_uri'] = $redirectUri;
        }

        Log::info("SePay: Creating link token for company {$companyXid}", ['payload' => $payload, 'baseUrl' => $this->baseUrl]);

        $response = $this->api()->post('/link-token/create', $payload);

        if ($response->failed()) {
            Log::error('SePay Create Link Token Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'company_xid' => $companyXid
            ]);
            throw new \Exception('Không thể tạo Link Token từ SePay Bank Hub: ' . ($response->json('message') ?? $response->body()));
        }

        return $response->json();
    }

    public function listBankAccounts(string $companyXid): array
    {
        $response = $this->api()->get('/bank-account', [
            'company_xid' => $companyXid,
            'page' => 1,
            'per_page' => 20,
        ]);

        if ($response->failed()) {
            Log::error('SePay Bank Account List Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'company_xid' => $companyXid,
            ]);
            throw new \Exception('Khong the lay danh sach tai khoan ngan hang tu SePay Bank Hub.');
        }

        return $response->json('data') ?? [];
    }
}
