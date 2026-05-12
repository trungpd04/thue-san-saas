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

        // NẾU SÂN ĐANG BỊ XÓA VÀ NGƯỜI DÙNG MUỐN KHÔI PHỤC (Bật is_active)
        if ($field->trashed() && isset($data['is_active']) && $data['is_active']) {
            $tenant = tenant();
            
            // Đếm số lượng sân đang tồn tại (Đang hoạt động + Đang bảo trì)
            $currentFieldsCount = Field::count(); 
            
            // Lấy giới hạn gói cước
            $subscription = $tenant->activeSubscription()->with('plan')->first();
            $limit = ($subscription && $subscription->plan) ? $subscription->plan->max_fields : 0;

            // Kiểm tra: Nếu số sân hiện tại đã chạm hoặc vượt ngưỡng -> Chặn khôi phục
            if ($limit > 0 && $currentFieldsCount >= $limit) {
                throw new \Exception("Không thể khôi phục sân. Gói cước hiện tại của bạn chỉ cho phép tối đa {$limit} sân.");
            }

            // Nếu vượt qua bài kiểm tra thì cho phép hồi sinh sân
            $field->restore();
        }

        // Cập nhật các thông tin khác (tên, loại, địa chỉ...)
        $field->update($data);
        return $field;
    }

    /**
     * Xóa mềm sân và kiểm tra lịch đặt
     */
    public function deleteField($id)
    {
        $field = Field::withTrashed()->findOrFail($id);

        // KIỂM TRA LỊCH ĐẶT: Nếu có là CHẶN LUÔN
        $hasFutureBookings = $field->bookings()
            ->where('booking_date', '>=', now()->toDateString())
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($hasFutureBookings) {
            // Ném lỗi trực tiếp, không cho phép bất kỳ ngoại lệ nào
            throw new \Exception("Không thể ngừng hoạt động sân này vì đang có khách đặt lịch trong tương lai. Bạn phải hủy hoặc hoàn thành các lịch đặt trước khi thực hiện thao tác này.");
        }

        // Nếu không có lịch mới cho phép thực hiện
        $field->update(['is_active' => false]);
        return $field->delete();
    }
}