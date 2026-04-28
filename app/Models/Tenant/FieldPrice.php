<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class FieldPrice extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'field_type_id',
        'start_time',
        'end_time',
        'day_type',
        'price_per_hour',
    ];

    protected function casts(): array
    {
        return [
            'price_per_hour' => 'decimal:2',
        ];
    }
}
