<?php

namespace App\Services\Saas;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Subscription;
use App\Models\SubscriptionPayment; // Import thêm Model hóa đơn dựa trên file SQL của bạn
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;

class SaasLandingService
{
    public function registerNewTenant(array $data)
    {
        try {
            DB::beginTransaction();

            // 1. Thuật toán xử lý sinh trùng Tenant Slug cực tốt của bạn
            $slug = Str::slug($data['company_name']);
            $originalSlug = $slug;
            $count = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }


            // 2. Tạo bản ghi bãi bến Tenant
            $tenant = Tenant::create([
                'name'      => $data['company_name'],
                'slug'      => $slug,
                'phone'     => $data['company_phone'],
                'address'   => $data['company_address'],
                'is_active' => 1,
            ]);

            // 3. Tạo tài khoản User với vai trò là Chủ sân (tenant_owner)
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $data['name'],
                'email'     => $data['email'],

                'password'  => Hash::make($data['password']),
                'role'      => 'tenant_owner',
                'is_active' => 1
            ]);

            // 4. Tìm kiếm thông tin gói cước để tính toán chu kỳ
            $plan = Plan::findOrFail($data['plan_id']);

            // Thiết lập ngày bắt đầu và kết thúc chu kỳ (Mặc định gói tháng)
            $startsAt = Carbon::now();
            $endsAt = Carbon::now()->addMonth();

            $subscription = Subscription::create([
                'tenant_id'     => $tenant->id,
                'plan_id'       => $plan->id,
                'status'        => 'trial', // Trạng thái dùng thử ban đầu
                'starts_at'     => $startsAt,
                'ends_at'       => $endsAt,
                'trial_ends_at' => Carbon::now()->addDays(7) // Đổi sang dùng Carbon cho đồng bộ hệ thống
            ]);

            // 5. ĐẮP THÊM LOGIC: Tạo bản ghi hóa đơn thanh toán (subscription_payments)
            // Giúp Database đầy đủ dữ liệu, không bị lỗi logic ràng buộc (Constraints)
            SubscriptionPayment::create([
                'tenant_id'            => $tenant->id,
                'subscription_id'      => $subscription->id,
                'amount'               => $plan->price_monthly,
                'payment_method'       => $plan->price_monthly == 0 ? 'free' : 'transfer', 
                'status'               => $plan->price_monthly == 0 ? 'completed' : 'pending', 
                'billing_period_start' => $startsAt->toDateString(),
                'billing_period_end'   => $endsAt->toDateString(),
                'paid_at'              => $plan->price_monthly == 0 ? Carbon::now() : null,
                'note'                 => "Hóa đơn khởi tạo chu kỳ đầu tiên cho gói: " . $plan->name,
            ]);

            DB::commit();

            return [
                'success' => true,
                'user'    => $user,
                'tenant'  => $tenant
            ];
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
