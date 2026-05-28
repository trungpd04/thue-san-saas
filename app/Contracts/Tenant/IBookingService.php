<?php

namespace App\Contracts\Tenant;

interface IBookingService
{
    /**
     * Store a new booking with transactions, locking, customer creation, and payments.
     *
     * @param string $tenantId
     * @param array $validatedData
     * @param array $options
     * @return array
     */
    public function storeBooking(string $tenantId, array $validatedData, array $options = []): array;
}
