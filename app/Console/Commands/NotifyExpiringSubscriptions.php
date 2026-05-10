<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionExpiringMail;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB; // Thêm dòng này

class NotifyExpiringSubscriptions extends Command
{
    /**
     * Tên lệnh dùng: php artisan subscription:notify-expiring
     */
    protected $signature = 'subscription:notify-expiring';

    /**
     * Mô tả lệnh
     */
    protected $description = 'Gửi email cho khách hàng sắp hết hạn gói dịch vụ trước 7, 3 và 1 ngày';

    public function handle()
    {
        // 1. Xác định 3 mốc ngày cụ thể (định dạng Y-m-d)
        $targetDates = [
            now()->addDays(7)->toDateString(),
            now()->addDays(3)->toDateString(),
            now()->addDays(1)->toDateString(),
        ];

        $this->info("Đang quét các gói hết hạn vào: " . implode(', ', $targetDates));

        // 2. Truy vấn các gói active có ngày hết hạn rơi đúng vào 3 mốc trên
        $subscriptions = Subscription::with(['tenant.owner', 'plan'])
            ->where('status', 'active')
            ->whereIn(DB::raw('DATE(ends_at)'), $targetDates)
            ->get();

        if ($subscriptions->isEmpty()) {
            $this->info("Không tìm thấy gói nào khớp với các mốc ngày trên.");
            return;
        }

        foreach ($subscriptions as $sub) {
            // Kiểm tra xem Tenant có chủ sở hữu và email không
            if ($sub->tenant && $sub->tenant->owner && $sub->tenant->owner->email) {
                Mail::to($sub->tenant->owner->email)->send(new SubscriptionExpiringMail($sub));
                $this->info("- Đã gửi mail nhắc nhở cho: " . $sub->tenant->name . " (Hết hạn ngày: " . $sub->ends_at->format('d/m/Y') . ")");
            }
        }

        $this->info("Hoàn tất.");
    }
}
