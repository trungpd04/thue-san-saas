<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Database\Concerns\HasScopedValidationRules;

class Tenant extends BaseTenant
{
    use HasScopedValidationRules;

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'phone',
            'address',
            'is_active',
        ];
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function subscriptions(): HasMany 
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->whereIn('status', ['active', 'trial'])->latest();
    }

    public function subscriptionPayments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }
    public function fields(): HasMany
    {
        return $this->hasMany(\App\Models\Tenant\Field::class);
    }
}
