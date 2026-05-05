<?php

namespace App\Services\Webhook\Strategies;

interface SePayStrategyInterface
{
    /**
     * Kiểm tra xem strategy này có hỗ trợ xử lý nội dung thanh toán (content) không
     */
    public function canHandle(string $content): bool;

    /**
     * Thực thi xử lý webhook
     */
    public function handle(array $data): array;
}
