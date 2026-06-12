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

    public function scopeActive($query)
    {
        return $query->where('fields.is_active', true);
    }

    public function scopeFilterByName($query, $name)
    {
        return $query->whereHas('tenant', function ($q) use ($name) {
            $q->where('name', 'like', "%{$name}%");
        });
    }

    public function scopeFilterByType($query, $typeId)
    {
        return $query->where('field_type_id', $typeId);
    }

    public function scopeWithDistance($query, $lat, $lng)
    {
        return $query->join('tenants', 'fields.tenant_id', '=', 'tenants.id')
            ->select('fields.*')
            ->selectRaw(
                "(6371 * acos(cos(radians(?)) * cos(radians(tenants.latitude)) * cos(radians(tenants.longitude) - radians(?)) + sin(radians(?)) * sin(radians(tenants.latitude)))) AS distance",
                [$lat, $lng, $lat]
            )
            ->orderBy('distance');
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
