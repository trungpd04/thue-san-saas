<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\SaveFieldRequest;
use App\Models\FieldType;
use App\Models\Tenant\Field;
use App\Services\Tenant\FieldService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldController extends Controller
{
    protected $fieldService;

    public function __construct(FieldService $fieldService)
    {
        $this->fieldService = $fieldService;
    }

    public function index()
    {
        // Lấy tất cả bao gồm cả sân đã xóa mềm để hiển thị trạng thái "Ngừng hoạt động"
        $fields = Field::withTrashed()
            ->with('fieldType')
            ->latest()
            ->get();

        return Inertia::render('Tenant/Fields/Index', [
            'fields' => $fields,
            'fieldTypes' => FieldType::all(),
        ]);
    }

    public function store(SaveFieldRequest $request)
    {
        try {
            $this->fieldService->createField($request->validated());
            return back()->with('success', 'Thêm sân mới thành công!');
        } catch (\Exception $e) {
            // Trả lỗi về để hiển thị message.error trên React
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(SaveFieldRequest $request, $id)
    {
        try {
            $this->fieldService->updateField($id, $request->validated());
            return back()->with('success', 'Cập nhật thông tin thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

   public function destroy($id)
    {
        try {
            $this->fieldService->deleteField($id);
            return back()->with('success', 'Sân đã được chuyển sang trạng thái ngừng hoạt động.');
        } catch (\Exception $e) {
            // Trả thông điệp lỗi về biến 'error' trong object 'errors' ở Frontend
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}