<?php

namespace App\Contracts;

interface PricingStrategyInterface
{
    /**
     * Tính toán giá cho một yêu cầu đặt sân cụ thể
     * 
     * @param array $data ['field_id', 'start_time', 'end_time', 'date']
     * @return float
     */
    public function calculate(array $data): float;
}
