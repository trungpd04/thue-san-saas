<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Field;
use Exception;
use Illuminate\Support\Facades\DB;

class FieldService
{
    /**
     * Tạo sân mới và kiểm tra giới hạn gói cước
     */
   public function createField(array $data)
    {
        $tenant = tenant();

        // SỬA TẠI ĐÂY: Đếm tất cả sân chưa bị "Ngừng hoạt động"
        // Lệnh count() của Laravel sẽ tự động bỏ qua các bản ghi đã Soft Delete (Ngừng hoạt động)
        // Nên nó sẽ đếm cả sân "Đang hoạt động" và "Đang bảo trì"
        $currentFieldsCount = Field::count(); 

        $subscription = $tenant->activeSubscription()->with('plan')->first();
        $limit = ($subscription && $subscription->plan) ? $subscription->plan->max_fields : 0;

        if ($limit > 0 && $currentFieldsCount >= $limit) {
            throw new Exception("Gói cước hiện tại chỉ cho phép tối đa {$limit} sân (bao gồm cả sân đang bảo trì).");
        }

        return Field::create($data);
    }

    /**
     * Cập nhật thông tin sân và xử lý khôi phục nếu cần
     */
    public function updateField($id, array $data)
    {
        $field = Field::withTrashed()->findOrFail($id);

        // Nếu sân đang bị xóa mềm mà người dùng bật lại trạng thái hoạt động
        if ($field->trashed() && isset($data['is_active']) && $data['is_active']) {
            $field->restore();
        }

        $field->update($data);
        return $field;
    }

    /**
     * Xóa mềm sân và kiểm tra lịch đặt
     */
    public function deleteField($id)
    {
        $field = Field::withTrashed()->findOrFail($id);

        // 1. Kiểm tra lịch đặt trong tương lai (không tính lịch đã hủy)
        $hasFutureBookings = $field->bookings()
            ->where('booking_date', '>=', now()->toDateString())
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($hasFutureBookings) {
            throw new Exception("Không thể ngừng hoạt động sân này vì đang có khách đặt lịch trong tương lai. Vui lòng xử lý lịch đặt trước.");
        }

        // 2. Chuyển trạng thái về ngừng hoạt động và xóa mềm
        $field->update(['is_active' => false]);
        return $field->delete();
    }
}