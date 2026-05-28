<?php

namespace App\Contracts\Tenant;

use App\Models\Tenant\Field;

interface IFieldQueryService
{
    /**
     * Get active fields grouped by tenant and field type, optionally with distance.
     *
     * @param float|null $lat
     * @param float|null $lng
     * @param int|null $fieldTypeId
     * @param string|null $name
     * @return array
     */
    public function getActiveFields($lat = null, $lng = null, $fieldTypeId = null, $name = null): array;

    /**
     * Get bookings for a specific field on a date.
     *
     * @param Field $field
     * @param string $dateStr
     * @return mixed
     */
    public function getBookingsForField(Field $field, string $dateStr);

    /**
     * Get active fields for a tenant.
     *
     * @param string $tenantId
     * @param int|null $fieldTypeId
     * @return mixed
     */
    public function getTenantActiveFields(string $tenantId, $fieldTypeId = null);

    /**
     * Get bookings for tenant fields.
     *
     * @param array $fieldIds
     * @param string $dateStr
     * @return mixed
     */
    public function getBookingsForTenantFields(array $fieldIds, string $dateStr);

    /**
     * Get available slots for tenant fields.
     *
     * @param string $tenantId
     * @param string $dateStr
     * @param int|null $fieldTypeId
     * @return array
     */
    public function getAvailableSlots(string $tenantId, string $dateStr, $fieldTypeId = null): array;
}
