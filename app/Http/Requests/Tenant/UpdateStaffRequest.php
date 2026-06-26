<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth('tenant')->user();
        return $user && $user->role->value === 'manager';
    }

    public function rules(): array
    {
        $staffId = $this->route('staff');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('staff', 'email')
                    ->where(fn ($query) => $query->where('tenant_id', tenant()->id))
                    ->ignore($staffId)
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:6'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên nhân viên.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Địa chỉ email không hợp lệ.',
            'email.unique' => 'Email này đã tồn tại trong hệ thống.',
            'password.min' => 'Mật khẩu phải chứa ít nhất 6 ký tự.',
        ];
    }
}
