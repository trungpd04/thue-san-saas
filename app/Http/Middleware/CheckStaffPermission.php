<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckStaffPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user('tenant');

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // Nếu tài khoản không còn hoạt động, tự động logout và redirect
        if (!$user->is_active) {
            Auth::guard('tenant')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('tenant.login', ['tenant' => tenant()->slug])
                ->withErrors(['email' => 'Tài khoản không hoạt động.']);
        }

        // Manager bypasses all permission checks
        if ($user->isManager()) {
            return $next($request);
        }

        // Staff check permissions
        $permissions = $user->permissions ?? [];
        if (!in_array($permission, $permissions)) {
            abort(403, 'Bạn không có quyền truy cập chức năng này.');
        }

        return $next($request);
    }
}
