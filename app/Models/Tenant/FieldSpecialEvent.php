<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FieldSpecialEvent extends Model
{
    public const EFFECT_BLOCK = 'block';

    public const EFFECT_SURGE = 'surge';

    protected $fillable = [
        'field_id',
        'event_date',
        'start_time',
        'end_time',
        'effect',
        'surge_percent',
        'title',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
        ];
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
