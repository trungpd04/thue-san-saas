<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class SaveFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Tạm thời return true, xử lý quyền (Role) sau nếu cần
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'field_type_id' => ['required', 'exists:field_types,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên sân.',
            'field_type_id.required' => 'Vui lòng chọn loại sân.',
            'field_type_id.exists' => 'Loại sân không hợp lệ.',
        ];
    }
}