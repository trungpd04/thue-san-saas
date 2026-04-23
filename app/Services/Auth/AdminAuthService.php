<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthService
{
    /**
     * @throws ValidationException
     */
    public function attemptLogin(array $credentials, bool $remember): void
    {
        if (! Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $user = Auth::user();

        if (! $user || ! $user->isAdmin() || ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Tài khoản không có quyền truy cập khu vực quản trị.',
            ]);
        }
    }

    public function logout(): void
    {
        Auth::logout();
    }
}

