<?php

namespace App\Services\Tenant\Pricing;

use App\Contracts\PricingStrategyInterface;
use App\Models\Tenant\Field;
use App\Models\Tenant\FieldPrice;
use Carbon\Carbon;
use Exception;

class StandardPricingStrategy implements PricingStrategyInterface
{
    public function calculate(array $data): float
    {
        $fieldId = $data['field_id'];
        $startTime = Carbon::parse($data['start_time']);
        $endTime = Carbon::parse($data['end_time']);
        $date = Carbon::parse($data['date']);

        $field = Field::findOrFail($fieldId);
        $dayType = ($date->isWeekend()) ? 'weekend' : 'weekday';

        // Lấy tất cả quy tắc giá có thể áp dụng (ưu tiên giá riêng của sân trước)
        $prices = FieldPrice::where('field_type_id', $field->field_type_id)
            ->where('day_type', $dayType)
            ->where(function ($query) use ($fieldId) {
                $query->where('field_id', $fieldId)
                    ->orWhereNull('field_id');
            })
            ->orderBy('field_id', 'desc') // Ưu tiên bản ghi có field_id (không NULL)
            ->get();

        if ($prices->isEmpty()) {
            throw new Exception("Không tìm thấy cấu hình giá cho sân này vào ngày " . $date->toDateString());
        }

        $totalPrice = 0;
        $currentTime = $startTime->copy();

        // Thuật toán tính giá theo khung giờ (chia nhỏ khoảng thời gian nếu span qua nhiều khung giá)
        while ($currentTime->lt($endTime)) {
            $applicablePrice = $this->findApplicablePrice($prices, $currentTime);

            if (!$applicablePrice) {
                throw new Exception("Không tìm thấy giá cho khung giờ " . $currentTime->format('H:i') . " vào ngày " . $date->toDateString());
            }

            // Tìm điểm kết thúc của khung giờ hiện tại hoặc thời gian kết thúc đặt sân
            $slotEndTime = Carbon::parse($currentTime->toDateString() . ' ' . $applicablePrice->end_time);
            $segmentEnd = $slotEndTime->lt($endTime) ? $slotEndTime : $endTime;

            $durationInHours = $currentTime->diffInMinutes($segmentEnd) / 60;
            $totalPrice += $durationInHours * $applicablePrice->price_per_hour;

            $currentTime = $segmentEnd;
        }

        return $totalPrice;
    }

    protected function findApplicablePrice($prices, $time)
    {
        $timeStr = $time->format('H:i:s');
        
        // Vì đã được sắp xếp field_id DESC, bản ghi đầu tiên thỏa mãn sẽ là bản ghi ưu tiên cao nhất
        return $prices->first(function ($price) use ($timeStr) {
            return $timeStr >= $price->start_time && $timeStr < $price->end_time;
        });
    }
}
