<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TenantAuthService
{
    /**
     * @throws ValidationException
     */
    public function attemptLogin(array $credentials, bool $remember): void
    {
        if (! Auth::guard('tenant')->attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $staff = Auth::guard('tenant')->user();

        if (! $staff || ! $staff->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Tài khoản không hoạt động.',
            ]);
        }
    }

    public function logout(): void
    {
        Auth::guard('tenant')->logout();
    }
}

