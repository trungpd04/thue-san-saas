<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\Admin\LoginRequest;
use App\Services\Auth\AdminAuthService;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Admin/Login');
    }

    public function store(LoginRequest $request, AdminAuthService $auth): SymfonyResponse
    {
        try {
            $auth->attemptLogin(
                $request->only('email', 'password'),
                $request->boolean('remember')
            );
        } catch (ValidationException $e) {
            if (Auth::check()) {
                $auth->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            throw $e;
        }

        $request->session()->regenerate();

        return Inertia::location(redirect()->intended(route('admin.dashboard')));
    }

    public function destroy(Request $request, AdminAuthService $auth): SymfonyResponse
    {
        $auth->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::location(route('admin.login'));
    }
}
