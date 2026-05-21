<?php

namespace App\Services\tenantlandingpage;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB; 
use Exception;

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

        $fields = [];
        if (method_exists($tenant, 'fields')) {
       
            $fields = $tenant->fields()
                             ->withoutGlobalScopes() 
                             ->with('fieldType') 
                             ->where('is_active', 1)
                             ->get();

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
        }

        return [
            'tenant' => $tenant,
            'fields' => $fields
        ];
    }
}