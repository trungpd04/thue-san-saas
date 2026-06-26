<?php

namespace App\Services\Tenant;

use App\Contracts\Tenant\IStaffService;
use App\Models\Tenant\Staff;
use App\Enums\StaffRole;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class StaffService implements IStaffService
{
    /**
     * @inheritDoc
     */
    public function getStaffMembers(): Collection
    {
        return Staff::withTrashed()->latest()->get();
    }

    /**
     * @inheritDoc
     */
    public function getMaxStaffLimit(): int
    {
        $subscription = tenant()->activeSubscription()->with('plan')->first();
        return ($subscription && $subscription->plan) ? $subscription->plan->max_staff : 1;
    }

    /**
     * @inheritDoc
     */
    public function getCurrentStaffCount(): int
    {
        // Only count regular staff (excluding manager), including soft-deleted ones
        return Staff::withTrashed()->where('role', StaffRole::Staff)->count();
    }

    /**
     * @inheritDoc
     */
    public function getPlanName(): string
    {
        $subscription = tenant()->activeSubscription()->with('plan')->first();
        return $subscription?->plan?->name ?? 'Gói mặc định';
    }

    /**
     * @inheritDoc
     */
    public function createStaff(array $data): Staff
    {
        $maxStaff = $this->getMaxStaffLimit();
        $currentStaffCount = $this->getCurrentStaffCount();

        if ($currentStaffCount >= $maxStaff) {
            throw new \Exception("Đã đạt giới hạn số lượng nhân viên của gói cước ({$maxStaff} nhân viên). Vui lòng nâng cấp gói cước để thêm nhân viên.");
        }

        return Staff::create([
            'tenant_id' => tenant()->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => StaffRole::Staff,
            'is_active' => $data['is_active'],
            'permissions' => $data['permissions'] ?? ['access_dashboard', 'manage_bookings'],
        ]);
    }

    /**
     * @inheritDoc
     */
    public function updateStaff(int $id, array $data): Staff
    {
        $staff = Staff::withTrashed()->findOrFail($id);

        $updateData = [];
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['email'])) {
            $updateData['email'] = $data['email'];
        }
        if (isset($data['phone'])) {
            $updateData['phone'] = $data['phone'];
        }

        if (isset($data['is_active'])) {
            $updateData['is_active'] = $data['is_active'];
            // Restore soft-deleted staff if marked as active
            if ($staff->trashed() && $data['is_active']) {
                $staff->restore();
            }
        }

        // Managers cannot have their permissions modified via this service to prevent lockout.
        if (!$staff->isManager() && array_key_exists('permissions', $data)) {
            $updateData['permissions'] = $data['permissions'] ?? [];
        }

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $staff->update($updateData);

        return $staff;
    }

    /**
     * @inheritDoc
     */
    public function deleteStaff(int $id): void
    {
        $staff = Staff::withTrashed()->findOrFail($id);

        if ($staff->isManager()) {
            throw new \Exception('Không thể xóa tài khoản Quản trị viên (Chủ sân).');
        }

        if ($staff->id === auth('tenant')->id()) {
            throw new \Exception('Bạn không thể tự xóa tài khoản của chính mình.');
        }

        // Set is_active to false and soft delete
        $staff->update(['is_active' => false]);
        $staff->delete();
    }
}
