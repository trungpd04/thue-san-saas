<?php

namespace App\Services\Tenant\Pricing;

use App\Contracts\PricingStrategyInterface;

class PricingManager
{
    protected array $strategies = [];

    public function __construct(
        HolidayPricingStrategy $holidayStrategy,
        StandardPricingStrategy $standardStrategy
    ) {
        // Đăng ký Holiday trước để hệ thống luôn check ngày lễ trước tiên
        $this->addStrategy($holidayStrategy);
        $this->addStrategy($standardStrategy);
    }

    public function addStrategy(PricingStrategyInterface $strategy)
    {
        $this->strategies[] = $strategy;
    }

    /**
     * Tính toán giá dựa trên các chiến lược hiện có
     * (Trong phiên bản này, chúng ta lấy giá từ chiến lược đầu tiên trả về kết quả)
     */
    public function calculate(array $data): float
    {
        foreach ($this->strategies as $strategy) {
            try {
                return $strategy->calculate($data);
            } catch (\Exception $e) {
                continue;
            }
        }

        throw new \Exception("Không thể tính giá cho yêu cầu này.");
    }
}
