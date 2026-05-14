<?php

namespace App\Http\Controllers\Tenant\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\Tenant\LoginRequest;
use App\Services\Auth\TenantAuthService;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedTenantSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Tenant/Login');
    }

    public function store(LoginRequest $request, TenantAuthService $auth): SymfonyResponse
    {
        try {
            $auth->attemptLogin(
                $request->only('email', 'password'),
                $request->boolean('remember')
            );
        } catch (ValidationException $e) {
            if (Auth::guard('tenant')->check()) {
                $auth->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            throw $e;
        }

        $request->session()->regenerate();

        $subscription = tenant()->activeSubscription()->with('plan')->first();

        if ($subscription?->plan && (float) $subscription->plan->price_monthly === 0.0) {
            $request->session()->flash('free_plan_login_popup', [
                'plan_name' => $subscription->plan->name,
            ]);
        }

        return redirect()->intended(route('tenant.dashboard', ['tenant' => tenant()->slug]));
    }

    public function destroy(Request $request, TenantAuthService $auth): SymfonyResponse
    {
        $auth->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('tenant.login', ['tenant' => tenant()->slug]);
    }
}
