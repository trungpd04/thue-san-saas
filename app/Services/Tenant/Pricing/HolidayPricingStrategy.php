<?php

namespace App\Services\Tenant\Pricing;

use App\Contracts\PricingStrategyInterface;
use App\Models\Tenant\FieldSpecialEvent;
use Carbon\Carbon;
use Exception;

class HolidayPricingStrategy implements PricingStrategyInterface
{
    protected StandardPricingStrategy $standardStrategy;

    public function __construct(StandardPricingStrategy $standardStrategy)
    {
        $this->standardStrategy = $standardStrategy;
    }

    /**
     * Tính giá cho ngày lễ/sự kiện đặc biệt dựa trên cấu hình trong database.
     * Ném Exception nếu không tìm thấy sự kiện tăng giá (surge) phù hợp.
     */
    public function calculate(array $data): float
    {
        $fieldId = $data['field_id'];
        $startTime = Carbon::parse($data['start_time']);
        $endTime = Carbon::parse($data['end_time']);
        $date = Carbon::parse($data['date']);

        // Gọi hàm protected để lấy sự kiện từ DB (giúp test dễ dàng Mock hơn)
        $event = $this->findSpecialEvent(
            $date->toDateString(),
            $fieldId,
            $startTime->format('H:i:s'),
            $endTime->format('H:i:s')
        );

        if (!$event) {
            throw new Exception("Không có sự kiện tăng giá cho khung giờ này.");
        }

        // Tính toán giá cơ bản từ chiến lược chuẩn
        $basePrice = $this->standardStrategy->calculate($data);

        // Áp dụng tỷ lệ tăng giá (ví dụ: surge_percent = 50 -> nhân hệ số 1.5)
        $surgePercent = $event->surge_percent ?? 0;
        
        return $basePrice * (1 + $surgePercent / 100);
    }

    /**
     * Truy vấn sự kiện đặc biệt từ database.
     */
    protected function findSpecialEvent(string $date, int $fieldId, string $startTime, string $endTime)
    {
        return FieldSpecialEvent::where('event_date', $date)
            ->where('effect', FieldSpecialEvent::EFFECT_SURGE)
            ->where(function ($query) use ($fieldId) {
                $query->where('field_id', $fieldId)
                    ->orWhereNull('field_id');
            })
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->orderBy('field_id', 'desc')
            ->first();
    }
}
