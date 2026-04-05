<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldType extends Model
{
    protected $connection = 'mysql';

    protected $fillable = [
        'name',
        'sport',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
