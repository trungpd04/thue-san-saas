<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Contracts\Tenant\IFieldQueryService::class, \App\Services\Tenant\FieldQueryService::class);
        $this->app->bind(\App\Contracts\Tenant\IBookingService::class, \App\Services\Tenant\BookingService::class);
        $this->app->bind(\App\Contracts\Tenant\IFieldService::class, \App\Services\Tenant\FieldService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (env('APP_ENV') !== 'local' || str_contains(request()->url(), 'ngrok-free.dev')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
