<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Field;
use App\Http\Requests\Tenant\SaveFieldRequest;
use App\Services\Tenant\FieldService;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use Illuminate\Http\Request;

class FieldController extends Controller
{
    public function __construct(
        protected FieldService $fieldService
    ) {}

    public function index()
{
    // Lấy tất cả sân, bao gồm cả sân đã xóa mềm (Soft Deleted)
    $fields = Field::withTrashed()
        ->with('fieldType')
        ->latest()
        ->get();

    return Inertia::render('Tenant/Fields/Index', [
        'fields' => $fields,
        'fieldTypes' => \App\Models\FieldType::all(),
    ]);
}

public function store(SaveFieldRequest $request)
{
    try {
        $this->fieldService->createField($request->validated());
        return redirect()->back()->with('success', 'Thêm sân mới thành công!');
    } catch (\Exception $e) {
        // Bắt lỗi vượt giới hạn từ Service và trả về dưới dạng lỗi validation
        return redirect()->back()->withErrors(['error' => $e->getMessage()]);
    }
}

   public function update(SaveFieldRequest $request, $id)
{
    // Tìm sân bao gồm cả những sân đã xóa mềm
    $field = Field::withTrashed()->findOrFail($id);

    // Logic khôi phục: Nếu sân đang bị xóa mềm và người dùng bật 'is_active' lên
    if ($field->trashed() && $request->is_active) {
        $field->restore();
    }

    // Cập nhật các thông tin khác
    $field->update($request->validated());

    return redirect()->back()->with('success', 'Cập nhật thông tin sân thành công!');
}

  public function destroy($id, Request $request)
    {
        $user = auth('tenant')->user();

        // 1. Check phân quyền (Dùng ->value vì role là Enum)
        if (!$user || $user->role->value !== 'manager') {
            abort(403, 'Chỉ chủ sân mới có quyền xóa.');
        }

        $field = Field::findOrFail($id);

        // 2. Check xem có lịch đặt sân ở tương lai không
        $hasFutureBookings = $field->bookings()
            ->where('booking_date', '>=', now()->toDateString())
            ->exists();

        // 3. Bắn cảnh báo nếu có lịch mà user chưa bấm xác nhận "Vẫn xóa" (force_delete)
        if ($hasFutureBookings && !$request->has('force_delete')) {
            return back()->with('booking_warning', 'Sân này đang có lịch đặt trong tương lai. Bạn có chắc chắn muốn ngừng hoạt động và xóa sân không?');
        }

        // 4. Thực hiện xóa mềm
        $field->update(['is_active' => false]);
        $field->delete();

        return back()->with('success', 'Đã ngừng hoạt động và xóa sân thành công!');
    }
}