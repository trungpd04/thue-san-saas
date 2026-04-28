<?php

namespace App\Models\Tenant;

use App\Enums\StaffRole;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Staff extends Authenticatable
{
    use BelongsToTenant;

    protected $table = 'staff';

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => StaffRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booked_by');
    }

    public function isManager(): bool
    {
        return $this->role === StaffRole::Manager;
    }
}
