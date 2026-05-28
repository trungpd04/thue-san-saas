<?php

namespace App\Services\tenantlandingpage;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantPublicService
{
    public function getPublicTenantDetails(string $slug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('is_active', 1)
            ->first();

        if (!$tenant) {
            return null;
        }



        $fields = DB::table('fields')
            ->leftJoin('field_types', 'fields.field_type_id', '=', 'field_types.id')
            ->where('fields.tenant_id', $tenant->id)
            ->where('fields.is_active', 1)
            ->select(
                'fields.*',
                'field_types.name as field_type_name'
            )
            ->get();


        foreach ($fields as $field) {

            $prices = DB::table('field_prices')
                ->where('field_type_id', $field->field_type_id)
                ->select(
                    'day_type',
                    'start_time',
                    'end_time',
                    'price_per_hour'
                )
                ->get();

            $field->field_prices = $prices;
        }


        if ($fields->isNotEmpty()) {

            $today = date('Y-m-d');

            $fieldIds = $fields->pluck('id')->toArray();

            $specialEvents = DB::table('field_special_events')
                ->whereIn('field_id', $fieldIds)
                ->where('event_date', $today)
                ->get()
                ->groupBy('field_id');

            foreach ($fields as $field) {
                $field->specialEvents = $specialEvents->get($field->id, collect([]));
            }
        }

        return [
            'tenant' => $tenant,
            'fields' => $fields
        ];
    }
}