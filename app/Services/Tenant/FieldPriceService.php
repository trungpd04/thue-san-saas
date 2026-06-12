<?php

namespace App\Services\Tenant;

use App\Models\Tenant\FieldPrice;
use App\Services\Tenant\Pricing\PricingManager;
use Exception;
use Illuminate\Support\Facades\DB;

class FieldPriceService
{
    protected $pricingManager;

    public function __construct(PricingManager $pricingManager)
    {
        $this->pricingManager = $pricingManager;
    }

    public function calculateBookingPrice(int $fieldId, string $startTime, string $endTime, string $date)
    {
        return $this->pricingManager->calculate([
            'field_id' => $fieldId,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'date' => $date
        ]);
    }

    public function getAllPricesGroupedByType()
    {
        return FieldPrice::orderBy('field_type_id')
            ->orderBy('day_type')
            ->orderBy('start_time')
            ->get()
            ->groupBy('field_type_id');
    }

    public function createPriceRule(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->validateOverlap($data);
            return FieldPrice::create($data);
        });
    }

    public function updatePriceRule($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $this->validateOverlap($data, $id);
            $price = FieldPrice::findOrFail($id);
            $price->update($data);
            return $price;
        });
    }

    public function deletePriceRule($id)
    {
        $price = FieldPrice::findOrFail($id);
        return $price->delete();
    }

    /**
     * Kiểm tra xem khung giờ mới có bị trùng lặp với các khung giờ đã tồn tại không
     */
    protected function validateOverlap(array $data, $excludeId = null)
    {
        $query = FieldPrice::where('field_type_id', $data['field_type_id'])
            ->where('field_id', $data['field_id'] ?? null)
            ->where('day_type', $data['day_type'])
            ->where(function ($q) use ($data) {
                $q->where(function ($sub) use ($data) {
                    $sub->where('start_time', '<', $data['end_time'])
                        ->where('end_time', '>', $data['start_time']);
                });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw new Exception("Khung giờ này bị trùng lặp với một khung giờ khác đã tồn tại cho loại sân này.");
        }
    }
}
