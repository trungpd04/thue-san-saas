<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'field_id',
        'customer_id',
        'time_slot_id',
        'recurring_booking_id',
        'booking_date',
        'start_time',
        'end_time',
        'total_price',
        'status',
        'note',
        'booked_by',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'total_price' => 'decimal:2',
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

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function recurringBooking(): BelongsTo
    {
        return $this->belongsTo(RecurringBooking::class);
    }

    public function bookedByStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'booked_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
