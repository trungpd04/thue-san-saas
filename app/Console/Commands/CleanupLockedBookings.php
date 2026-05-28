<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

class CleanupLockedBookings extends Command
{
    protected $signature = 'booking:cleanup-expired';
    protected $description = 'Hủy các đơn đặt sân đã khóa nhưng không thanh toán sau 5 phút';

    public function handle()
    {
        $expiredTime = now()->subMinutes(5);
        
        $expiredCount = \Illuminate\Support\Facades\DB::table('bookings')
            ->where('status', 'locked_pending')
            ->where('locked_at', '<', $expiredTime)
            ->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

        if ($expiredCount > 0) {
            $this->info("Đã giải phóng {$expiredCount} slot đặt sân hết hạn.");
        }
    }
}
