<?php

namespace App\Factories\Admin;

use App\Models\Plan;

class PlanFactory
{
    /**
     * Nơi chứa logic khởi tạo đối tượng Plan.
     * Sau này nếu có các điều kiện phức tạp (ví dụ: gán tag, tính toán lại giá
     * dựa trên loại gói), ta chỉ cần sửa ở đây mà không làm phình Service.
     */
    public static function make(array $data): Plan
    {
        $plan = new Plan();
        $plan->fill($data);

        // Ví dụ một logic mặc định: Nếu không truyền is_active, luôn set là true
        if (!isset($data['is_active'])) {
            $plan->is_active = true;
        }

        // Bạn có thể thêm các logic định dạng dữ liệu khác ở đây trước khi trả về object

        return $plan;
    }
}