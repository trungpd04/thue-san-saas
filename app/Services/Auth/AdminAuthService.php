<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthService
{
    /**
     * @throws ValidationException
     */
    public function attemptLogin(array $credentials, bool $remember): void
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if (! $user->isAdmin() || ! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Tài khoản không có quyền truy cập khu vực quản trị.',
            ]);
        }

        Auth::login($user, $remember);
    }

    public function logout(): void
    {
        Auth::logout();
    }
}


