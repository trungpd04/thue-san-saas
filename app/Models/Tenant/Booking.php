<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Booking extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'field_id',
        'customer_id',
        'recurring_booking_id',
        'booking_date',
        'start_time',
        'end_time',
        'base_price',
        'event_surcharge_amount',
        'total_price',
        'pricing_breakdown',
        'status',
        'locked_at',
        'note',
        'booked_by',
        'field_special_event_id',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'base_price' => 'decimal:2',
            'event_surcharge_amount' => 'decimal:2',
            'total_price' => 'decimal:2',
            'pricing_breakdown' => 'array',
            'locked_at' => 'datetime',
        ];
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function recurringBooking(): BelongsTo
    {
        return $this->belongsTo(RecurringBooking::class);
    }

    public function bookedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'booked_by');
    }

    public function fieldSpecialEvent(): BelongsTo
    {
        return $this->belongsTo(FieldSpecialEvent::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
