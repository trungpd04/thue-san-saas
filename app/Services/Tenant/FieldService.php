<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Field;
use App\Models\FieldType;
use Illuminate\Database\Eloquent\Collection;

class FieldService
{
    /**
     * Lấy danh sách sân kèm loại sân
     */
    public function getAllFields(): Collection
    {
        return Field::with('fieldType')->latest()->get();
    }

    /**
     * Lấy danh sách loại sân đang hoạt động cho Dropdown
     */
    public function getActiveFieldTypes(): Collection
    {
        return FieldType::where('is_active', true)->get(['id', 'name', 'sport']);
    }

    /**
     * Thêm sân mới
     */
   public function createField($data)
    {
        $tenant = tenant(); 
        
        // 1. Đếm số sân đang hoạt động
        $currentFieldsCount = \App\Models\Tenant\Field::where('tenant_id', $tenant->id)->count();
        
        // 2. Lấy giới hạn từ gói cước (Dùng hàm activeSubscription có sẵn của bạn)
        $subscription = $tenant->activeSubscription()->with('plan')->first();
        $limit = ($subscription && $subscription->plan) ? $subscription->plan->max_fields : 0; 

        // 3. Chặn tạo mới nếu vượt trần
        if ($limit > 0 && $currentFieldsCount >= $limit) {
            throw new \Exception("Gói cước hiện tại chỉ cho phép tối đa {$limit} sân. Vui lòng nâng cấp gói để tiếp tục.");
        }

        return \App\Models\Tenant\Field::create($data);
    }

    /**
     * Cập nhật thông tin sân
     */
    public function updateField(Field $field, array $data): bool
    {
        return $field->update($data);
    }

    /**
     * Xóa sân
     */
    public function deleteField(Field $field): bool|null
    {
        return $field->delete();
    }
}