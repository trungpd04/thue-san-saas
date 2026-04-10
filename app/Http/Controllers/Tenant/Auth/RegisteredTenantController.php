<?php

namespace App\Http\Controllers\Tenant\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\Tenant\RegisterTenantRequest;
use App\Services\Tenant\TenantRegistrationService;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredTenantController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Tenant/Register');
    }

    public function store(RegisterTenantRequest $request, TenantRegistrationService $registration): RedirectResponse
    {
        $result = $registration->register($request->validated());

        return redirect()->away($result['login_url']);
    }
}

