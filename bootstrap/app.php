<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\CheckStaffPermission;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
            'permission' => CheckStaffPermission::class,
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            '*/sepay/webhook',
            'sepay/webhook', // Just in case
        ]);

        $middleware->redirectGuestsTo(function (Request $request) {
            if (tenancy()->initialized) {
                return route('tenant.login', ['tenant' => tenant()->slug]);
            }

            if ($request->is('tenant/*')) {
                $slug = $request->segment(2);

                if (is_string($slug) && $slug !== '') {
                    return url("/tenant/{$slug}/login");
                }
            }

            return route('admin.login');
        });

        $middleware->redirectUsersTo(function (Request $request) {
            if (tenancy()->initialized && auth('tenant')->check()) {
                return route('tenant.dashboard', ['tenant' => tenant()->slug]);
            }

            return route('admin.dashboard');
        });
    })->withSchedule(function ($schedule) {
        $schedule->command('booking:cleanup-expired')->everyMinute();
        // Chạy lệnh thông báo vào 8:00 sáng mỗi ngày
        $schedule->command('subscription:notify-expiring')->dailyAt('08:00');
    })->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
