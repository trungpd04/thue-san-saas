<?php

namespace App\Contracts\Tenant;

interface IFieldService
{
    /**
     * Create a new field with quota check and name uniqueness check.
     *
     * @param array $data
     * @return mixed
     */
    public function createField(array $data);

    /**
     * Update an existing field with quota/name checks.
     *
     * @param mixed $id
     * @param array $data
     * @return mixed
     */
    public function updateField($id, array $data);

    /**
     * Soft delete/deactivate a field if it has no future bookings.
     *
     * @param mixed $id
     * @return mixed
     */
    public function deleteField($id);
}
