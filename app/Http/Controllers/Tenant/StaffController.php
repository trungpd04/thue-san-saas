<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Staff;
use App\Enums\StaffRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        $subscription = tenant()->activeSubscription()->with('plan')->first();
        $maxStaff = ($subscription && $subscription->plan) ? $subscription->plan->max_staff : 1;
        
        // Only count regular staff (excluding manager), including soft-deleted ones
        $currentStaffCount = Staff::withTrashed()->where('role', StaffRole::Staff)->count();

        // Get all staff members for the tenant including soft deleted ones
        $staffMembers = Staff::withTrashed()->latest()->get();

        return Inertia::render('Tenant/Staff/Index', [
            'staffMembers' => $staffMembers,
            'maxStaff' => $maxStaff,
            'currentStaffCount' => $currentStaffCount,
            'planName' => $subscription?->plan?->name ?? 'Gói mặc định',
        ]);
    }

    public function store(Request $request)
    {
        $subscription = tenant()->activeSubscription()->with('plan')->first();
        $maxStaff = ($subscription && $subscription->plan) ? $subscription->plan->max_staff : 1;
        
        // Only count regular staff (excluding manager), including soft-deleted ones
        $currentStaffCount = Staff::withTrashed()->where('role', StaffRole::Staff)->count();
        if ($currentStaffCount >= $maxStaff) {
            return back()->withErrors(['error' => "Đã đạt giới hạn số lượng nhân viên của gói cước ({$maxStaff} nhân viên). Vui lòng nâng cấp gói cước để thêm nhân viên."]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('staff', 'email')->where(fn ($query) => $query->where('tenant_id', tenant()->id))
            ],
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'is_active' => 'required|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        Staff::create([
            'tenant_id' => tenant()->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => StaffRole::Staff,
            'is_active' => $validated['is_active'],
            'permissions' => $validated['permissions'] ?? ['access_dashboard', 'manage_bookings'], // Mặc định 2 quyền này
        ]);

        return back()->with('success', 'Thêm nhân viên mới thành công!');
    }

    public function update(Request $request, $id)
    {
        $staff = Staff::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('staff', 'email')->where(fn ($query) => $query->where('tenant_id', tenant()->id))->ignore($staff->id)
            ],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'is_active' => 'sometimes|required|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $updateData = [];
        if ($request->has('name')) $updateData['name'] = $validated['name'];
        if ($request->has('email')) $updateData['email'] = $validated['email'];
        if ($request->has('phone')) $updateData['phone'] = $validated['phone'];
        
        if ($request->has('is_active')) {
            $updateData['is_active'] = $validated['is_active'];
            // Restore soft-deleted staff if marked as active
            if ($staff->trashed() && $validated['is_active']) {
                $staff->restore();
            }
        }

        // Managers cannot have their permissions modified via this controller to prevent locking out.
        if (!$staff->isManager() && $request->has('permissions')) {
            $updateData['permissions'] = $validated['permissions'] ?? [];
        }

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $staff->update($updateData);

        return back()->with('success', 'Cập nhật nhân viên thành công!');
    }

    public function destroy($id)
    {
        $staff = Staff::withTrashed()->findOrFail($id);

        if ($staff->isManager()) {
            return back()->withErrors(['error' => 'Không thể xóa tài khoản Quản trị viên (Chủ sân).']);
        }

        if ($staff->id === auth('tenant')->id()) {
            return back()->withErrors(['error' => 'Bạn không thể tự xóa tài khoản của chính mình.']);
        }

        // Set is_active to false and soft delete
        $staff->update(['is_active' => false]);
        $staff->delete();

        return back()->with('success', 'Xóa nhân viên thành công!');
    }
}
