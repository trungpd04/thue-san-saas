<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'note' => 'nullable|string|max:1000',
            'total_price' => 'required|numeric|min:0',
            'pricing_breakdown' => 'required|array',
            'pricing_breakdown.*.field_id' => 'required|exists:fields,id',
            'pricing_breakdown.*.start_time' => 'required|date_format:H:i',
            'pricing_breakdown.*.end_time' => 'required|date_format:H:i',
            'pricing_breakdown.*.price' => 'required|numeric|min:0',
        ];
    }
}
