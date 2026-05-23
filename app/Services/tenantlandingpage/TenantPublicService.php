<?php

namespace App\Services\tenantlandingpage;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB; 

class TenantPublicService
{
    public function getPublicTenantDetails(string $slug)
    {
        $tenant = Tenant::where('slug', $slug)->where('is_active', 1)->first();
        if (!$tenant) return null;


        $fields = DB::table('fields')
                    ->leftJoin('field_types', 'fields.field_type_id', '=', 'field_types.id')
                    ->leftJoin('field_prices', 'fields.field_type_id', '=', 'field_prices.field_type_id')
                    ->where('fields.tenant_id', $tenant->id)
                    ->where('fields.is_active', 1)
                    ->select(
                        'fields.*', 
                        'field_types.name as field_type_name', 
                        'field_prices.price_per_hour'
                    )
                    ->get();

        if ($fields->isNotEmpty()) {
            $today = date('Y-m-d');
            $fieldIds = $fields->pluck('id')->toArray();

            $specialEvents = DB::table('field_special_events')
                                ->whereIn('field_id', $fieldIds)
                                ->where('event_date', $today)
                                ->get()->groupBy('field_id');

            foreach ($fields as $field) {
                $field->specialEvents = $specialEvents->get($field->id, collect([]));
            }
        }

        return ['tenant' => $tenant, 'fields' => $fields];
    }
}