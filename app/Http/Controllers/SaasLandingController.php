<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Saas\SaasLandingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class SaasLandingController extends Controller
{
    protected $saasService;


    public function __construct(SaasLandingService $saasService)
    {
        $this->saasService = $saasService;
    }


    public function index(): Response
    {

        $plans = $this->saasService->getAvailablePlans();

        return Inertia::render('SaaS/Landing', [
            'plans' => $plans
        ]);
    }


    public function registerTenant(Request $request)
    {

        $validated = $request->validate([
            'company_name' => 'required|string|min:3|max:255',
            'name'         => 'required|string|min:2|max:255',
            'company_phone'   => 'required|string|max:20',
            'company_address' => 'required|string|max:500',
            'email'        => 'required|string|email|max:255|unique:users,email',
            'password'     => 'required|string|min:8|confirmed',
            'plan_id'      => 'required|exists:plans,id',
        ], [
            'company_name.min'   => 'Tên chuỗi sân / tổ chức phải chứa từ 3 ký tự trở lên.',
            'email.unique'       => 'Địa chỉ email quản trị này đã được đăng ký sử dụng.',
            'password.min'       => 'Mật khẩu bảo mật bắt buộc phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận nhập lại chưa trùng khớp.',
            'plan_id.exists'     => 'Gói dịch vụ hệ thống bạn lựa chọn không hợp lệ.'
        ]);

        try {

            $result = $this->saasService->registerNewTenant($validated);

            if ($result['success']) {

                return redirect()->back()->with('success', "Khởi tạo hệ thống thành công!");
            }
        } catch (Exception $e) {

            return back()->withErrors(['error' => 'Lỗi khởi tạo hệ thống: ' . $e->getMessage()])->withInput();
        }
    }
}
