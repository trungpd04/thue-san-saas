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

          
            $slug = Str::slug($data['company_name']);
            $originalSlug = $slug;
            $count = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }

            $tenant = Tenant::create([
                'name'      => $data['company_name'],
                'slug'      => $slug,
                'phone'     => $data['company_phone'],
                'address'   => $data['company_address'],
                'is_active' => 1,
            ]);

     
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $data['name'],
                'email'     => $data['email'],
                'password'  => Hash::make($data['password']),
                'role'      => 'tenant_owner',
                'is_active' => 1
            ]);

           
            $plan = Plan::findOrFail($data['plan_id']);

        
            $startsAt = Carbon::now();
            $endsAt = Carbon::now()->addMonth();

            $subscription = Subscription::create([
                'tenant_id'     => $tenant->id,
                'plan_id'       => $plan->id,
                'status'        => 'trial', 
                'starts_at'     => $startsAt,
                'ends_at'       => $endsAt,
                'trial_ends_at' => Carbon::now()->addDays(7) 
            ]);


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


    public function getAvailablePlans()
    {
 
        return Plan::where('is_active', 1)
            ->select('id', 'name', 'price_monthly as price', 'max_fields', 'max_staff')
            ->get()
            ->map(function ($plan) {
                $plan->features = [
                    "Hỗ trợ quản lý tối đa {$plan->max_fields} sân bãi",
                    "Phân quyền tối đa {$plan->max_staff} nhân viên vận hành",
                    "Hệ thống tự động chia ca lưới ca đá thông minh",
                    "Báo cáo thống kê doanh thu thời gian thực chuẩn xác"
                ];
                return $plan;
            });
    }
}