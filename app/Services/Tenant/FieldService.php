<?php

namespace App\Services\Tenant;

use App\Models\Tenant\Field;
use Exception;

class FieldService
{
    /**
     * Tạo sân mới với quy tắc quota nghiêm ngặt và kiểm tra trùng tên
     */
    public function createField(array $data)
    {
        $tenant = tenant();

        // 1. KIỂM TRA GIỚI HẠN GÓI CƯỚC (Tính trên tổng lịch sử tạo sân)
        // Sử dụng withTrashed() để đếm cả những sân đã "Ngừng hoạt động"
        $totalCreatedFields = Field::withTrashed()->count();

        $subscription = $tenant->activeSubscription()->with('plan')->first();
        $limit = ($subscription && $subscription->plan) ? $subscription->plan->max_fields : 0;

        // Nếu đã đạt giới hạn thì không cho tạo thêm, dù đã xóa sân cũ
        if ($limit > 0 && $totalCreatedFields >= $limit) {
            throw new Exception("Bạn đã sử dụng hết hạn ngạch tạo sân của gói cước ({$limit} sân). Lưu ý: Hệ thống tính trên tổng số sân đã từng tạo.");
        }

        // 2. KIỂM TRA TRÙNG TÊN (Trong cùng loại sân và địa chỉ)
        // Kiểm tra cả trong danh sách sân đã xóa để tránh xung đột khi khôi phục sau này
        $isDuplicate = Field::withTrashed()
            ->where('name', $data['name'])
            ->where('field_type_id', $data['field_type_id'])
            ->where('location', $data['location'])
            ->exists();

        if ($isDuplicate) {
            throw new Exception("Tên sân này đã tồn tại cho cùng loại sân và địa chỉ này. Vui lòng đặt tên khác.");
        }

        return Field::create($data);
    }

    /**
     * Cập nhật thông tin sân và kiểm tra trùng tên khi đổi tên
     */
    public function updateField($id, array $data)
    {
        $field = Field::withTrashed()->findOrFail($id);

        // Kiểm tra trùng tên khi người dùng thay đổi Tên, Loại hoặc Địa chỉ
        $isDuplicate = Field::withTrashed()
            ->where('id', '!=', $id) // Loại trừ chính sân đang sửa
            ->where('name', $data['name'])
            ->where('field_type_id', $data['field_type_id'])
            ->where('location', $data['location'])
            ->exists();

        if ($isDuplicate) {
            throw new Exception("Thông tin chỉnh sửa bị trùng với một sân khác đã tồn tại (cùng tên, loại và địa chỉ).");
        }

        // Logic khôi phục sân (giữ nguyên kiểm tra quota nếu bạn muốn cho phép khôi phục khi chưa xóa vĩnh viễn)
        if ($field->trashed() && isset($data['is_active']) && $data['is_active']) {
            // Lưu ý: Vì quota tính trên tổng số đã tạo (gồm cả trashed), 
            // nên việc khôi phục ở đây không làm tăng tổng số sân đã count ở hàm create.
            $field->restore();
        }

        $field->update($data);
        return $field;
    }

    /**
     * Xóa mềm sân (Giữ nguyên logic chặn xóa nếu có lịch đặt)
     */
    public function deleteField($id)
    {
        $field = Field::withTrashed()->findOrFail($id);

        $hasFutureBookings = $field->bookings()
            ->where('booking_date', '>=', now()->toDateString())
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($hasFutureBookings) {
            throw new Exception("Không thể ngừng hoạt động sân vì đang có lịch đặt. Vui lòng xử lý lịch trước.");
        }

        $field->update(['is_active' => false]);
        return $field->delete();
    }
}