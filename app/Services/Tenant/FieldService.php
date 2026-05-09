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
    public function createField(array $data): Field
    {
        // Cột tenant_id sẽ tự động được điền do ta đang ở trong context của Tenant
        return Field::create($data);
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