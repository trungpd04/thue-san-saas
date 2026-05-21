<?php

namespace App\Http\Controllers;

use App\Services\tenantlandingpage\TenantPublicService; 
use Illuminate\Http\Request;

class TenantPublicController extends Controller
{
    protected $tenantPublicService;

    public function __construct(TenantPublicService $tenantPublicService)
    {
        $this->tenantPublicService = $tenantPublicService;
    }

    public function show($slug)
    {
      
        $data = $this->tenantPublicService->getPublicTenantDetails($slug);


        if (!$data) {
            abort(404, 'Bãi sân thể thao không tồn tại hoặc đã bị khóa.');
        }


        $tenant = $data['tenant'];
        $fields = $data['fields'];


        return view('tenantLandingPage.public_landing', compact('tenant', 'fields'));
    }

    public function schedule($slug, $field_id)
{
   
    $data = $this->tenantPublicService->getPublicTenantDetails($slug);

    if (!$data) {
        abort(404, 'Bãi sân không tồn tại.');
    }

    $tenant = $data['tenant'];


    $currentField = collect($data['fields'])->firstWhere('id', $field_id);

    if (!$currentField && $field_id !== 'demo') {
        abort(404, 'Sân con không tồn tại hoặc đã bị đóng cửa.');
    }

    return "Hoàng đã kết nối thành công sang Task 23! Bạn đang xem lịch của: " . ($currentField ? $currentField->name : 'Sân mẫu Demo');
}
}
