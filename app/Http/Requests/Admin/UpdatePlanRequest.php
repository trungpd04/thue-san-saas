<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Trả về true vì việc check quyền admin đã được Middleware lo
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'max_fields' => 'required|integer|min:1',
            'max_staff' => 'required|integer|min:1',
            'price_monthly' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ];
    }
}