<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $payments = SubscriptionPayment::query()
            ->with([
                'tenant:id,name,slug,phone',
                'subscription.plan:id,name',
            ])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('transaction_ref', 'like', "%{$search}%")
                        ->orWhere('note', 'like', "%{$search}%")
                        ->orWhereHas('tenant', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $summary = SubscriptionPayment::query()
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw("SUM(CASE WHEN status IN ('paid', 'success') THEN amount ELSE 0 END) as paid_amount")
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount")
            ->first();

        return Inertia::render('PaymentHistory', [
            'payments' => $payments,
            'filters' => $filters,
            'stats' => [
                'total_count' => (int) ($summary->total_count ?? 0),
                'paid_amount' => (float) ($summary->paid_amount ?? 0),
                'pending_amount' => (float) ($summary->pending_amount ?? 0),
            ],
        ]);
    }
}
