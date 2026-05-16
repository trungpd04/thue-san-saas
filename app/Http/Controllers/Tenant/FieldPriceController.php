<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FieldType;
use App\Models\Tenant\Field;
use App\Services\Tenant\FieldPriceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FieldPriceController extends Controller
{
    protected $fieldPriceService;

    public function __construct(FieldPriceService $fieldPriceService)
    {
        $this->fieldPriceService = $fieldPriceService;
    }

    public function index()
    {
        return Inertia::render('Tenant/Prices/Index', [
            'fieldTypes' => FieldType::all(),
            'fields' => Field::all(),
            'prices' => $this->fieldPriceService->getAllPricesGroupedByType(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'field_type_id' => 'required|exists:field_types,id',
            'field_id' => 'nullable|exists:fields,id',
            'day_type' => 'required|in:weekday,weekend',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'price_per_hour' => 'required|numeric|min:0',
        ]);

        try {
            $this->fieldPriceService->createPriceRule($validated);
            return back()->with('success', 'Thêm khung giá mới thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'field_type_id' => 'required|exists:field_types,id',
            'field_id' => 'nullable|exists:fields,id',
            'day_type' => 'required|in:weekday,weekend',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'price_per_hour' => 'required|numeric|min:0',
        ]);

        try {
            $this->fieldPriceService->updatePriceRule($id, $validated);
            return back()->with('success', 'Cập nhật khung giá thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $this->fieldPriceService->deletePriceRule($id);
            return back()->with('success', 'Xóa khung giá thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
