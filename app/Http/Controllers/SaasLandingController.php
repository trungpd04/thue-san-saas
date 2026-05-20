<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\Saas\SaasLandingService; 
use Illuminate\Http\Request;
use Exception;

class SaasLandingController extends Controller
{
    protected $saasService;

    public function __construct(SaasLandingService $saasService)
    {
        $this->saasService = $saasService;
    }


    public function index()
    {

        $plans = Plan::where('is_active', 1)->get();
        return view('saas.landing', compact('plans'));
    }

    /**
     * Tiếp nhận dữ liệu Form đăng ký thuê gói SaaS
     */
    public function registerTenant(Request $request)
    {
        // 1. Kiểm tra tính hợp lệ dữ liệu đầu vào cực kỳ chặt chẽ
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
            // 2. Chuyển tiếp mảng dữ liệu an toàn xuống tầng Service để xử lý nghiệp vụ DB
            $result = $this->saasService->registerNewTenant($validated);

            if ($result['success']) {

                return redirect()->back()->with('success', 'Hệ thống quản lý bãi sân ' . $result['tenant']->name . ' đã được khởi tạo thành công! Hãy đăng nhập hệ thống quản trị.');
            }

        } catch (Exception $e) {
 
            return back()->withErrors(['error' => 'Lỗi khởi tạo hệ thống: ' . $e->getMessage()])->withInput();
        }
    }
}