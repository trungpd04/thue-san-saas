<?php

namespace App\Models\Tenant;

use App\Models\FieldType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\Tenant\RecurringBooking;



class Field extends Model
{
    use SoftDeletes;
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'field_type_id',
        'name',
        'description',
        'location',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function fieldType(): BelongsTo
    {
        return $this->belongsTo(FieldType::class);
    }

    public function priceRules(): HasMany
    {
        return $this->hasMany(FieldPrice::class, 'field_type_id', 'field_type_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function recurringBookings(): HasMany
    {
        return $this->hasMany(RecurringBooking::class);
    }
}
