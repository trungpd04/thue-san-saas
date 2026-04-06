<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Admin/Login');
    }

    public function store(Request $request): SymfonyResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(
            $request->only('email', 'password'),
            $request->boolean('remember')
        )) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        if (! $user->isAdmin() || ! $user->is_active) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Tài khoản không có quyền truy cập khu vực quản trị.',
            ]);
        }

        return Inertia::location(redirect()->intended(route('admin.dashboard')));
    }

    public function destroy(Request $request): SymfonyResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::location(route('admin.login'));
    }
}
