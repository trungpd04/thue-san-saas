<?php

namespace App\Contracts\Tenant;

use App\Models\Tenant\Staff;
use Illuminate\Database\Eloquent\Collection;

interface IStaffService
{
    /**
     * Get all staff members for the tenant including soft deleted ones.
     *
     * @return Collection
     */
    public function getStaffMembers(): Collection;

    /**
     * Get the max staff count limit based on active subscription.
     *
     * @return int
     */
    public function getMaxStaffLimit(): int;

    /**
     * Get current staff count (regular staff, including soft-deleted ones).
     *
     * @return int
     */
    public function getCurrentStaffCount(): int;

    /**
     * Get active subscription plan name.
     *
     * @return string
     */
    public function getPlanName(): string;

    /**
     * Create a new staff member.
     *
     * @param array $data
     * @return Staff
     * @throws \Exception
     */
    public function createStaff(array $data): Staff;

    /**
     * Update an existing staff member.
     *
     * @param int $id
     * @param array $data
     * @return Staff
     * @throws \Exception
     */
    public function updateStaff(int $id, array $data): Staff;

    /**
     * Delete/disable a staff member.
     *
     * @param int $id
     * @return void
     * @throws \Exception
     */
    public function deleteStaff(int $id): void;
}
