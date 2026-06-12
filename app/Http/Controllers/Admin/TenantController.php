<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(): Response
    {
        $tenants = Tenant::query()
            ->with([
                'owner:id,name,email,phone,is_active,tenant_id',
                'activeSubscription.plan:id,name,price_monthly,max_fields,max_staff',
            ])
            ->withCount('subscriptionPayments')
            ->withSum(['subscriptionPayments as paid_revenue' => fn ($query) => $query->whereIn('status', ['paid', 'success'])], 'amount')
            ->latest()
            ->get();

        return Inertia::render('Tenant', [
            'tenants' => $tenants,
            'stats' => [
                'total' => $tenants->count(),
                'active' => $tenants->where('is_active', true)->count(),
                'inactive' => $tenants->where('is_active', false)->count(),
                'revenue' => (float) $tenants->sum('paid_revenue'),
            ],
        ]);
    }

    public function updateStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $tenant->update([
            'is_active' => $validated['is_active'],
        ]);

        $tenant->owner?->update([
            'is_active' => $validated['is_active'],
        ]);

        return back()->with('success', 'Cập nhật trạng thái chủ sân thành công.');
    }
}
