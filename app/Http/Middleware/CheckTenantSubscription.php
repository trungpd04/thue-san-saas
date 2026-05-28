<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = tenant();

        if (!$tenant) {
            return $next($request);
        }

        $activeSub = $tenant->activeSubscription;
        $isValid = false;

        if ($activeSub) {
            if ($activeSub->status === 'trial' && $activeSub->trial_ends_at && !$activeSub->trial_ends_at->isPast()) {
                $isValid = true;
            } elseif ($activeSub->status === 'active' && $activeSub->ends_at && !$activeSub->ends_at->isPast()) {
                $isValid = true;
            }
        }

        if (!$isValid) {
            // Cập nhật lại status nếu đã hết hạn
            if ($activeSub && (($activeSub->status === 'trial' && $activeSub->trial_ends_at && $activeSub->trial_ends_at->isPast()) || ($activeSub->status === 'active' && $activeSub->ends_at && $activeSub->ends_at->isPast()))) {
                $activeSub->update(['status' => 'expired']);
            }

            // Nếu không phải là route liên quan đến subscription và logout thì redirect
            if (!$request->routeIs('tenant.subscription.*') && !$request->routeIs('tenant.logout')) {
                return redirect()->route('tenant.subscription.index', ['tenant' => $tenant->slug])
                    ->with('error', 'Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.');
            }
        }

        return $next($request);
    }
}
