<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\FieldType;
use App\Models\Tenant\Field;
use App\Models\Tenant\FieldSpecialEvent;
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
            'specialEvents' => FieldSpecialEvent::with('field')->orderBy('event_date', 'desc')->get(),
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

    public function storeSpecialEvent(Request $request)
    {
        $validated = $request->validate([
            'field_id' => 'nullable|exists:fields,id',
            'event_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'effect' => 'required|in:surge,block',
            'surge_percent' => 'nullable|required_if:effect,surge|integer|min:0|max:500',
            'title' => 'required|string|max:255',
            'note' => 'nullable|string',
        ]);

        $validated['start_time'] = date('H:i:s', strtotime($validated['start_time']));
        $validated['end_time'] = date('H:i:s', strtotime($validated['end_time']));

        FieldSpecialEvent::create($validated);

        return back()->with('success', 'Thêm sự kiện mới thành công!');
    }

    public function updateSpecialEvent(Request $request, $id)
    {
        $specialEvent = FieldSpecialEvent::findOrFail($id);

        $validated = $request->validate([
            'field_id' => 'nullable|exists:fields,id',
            'event_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'effect' => 'required|in:surge,block',
            'surge_percent' => 'nullable|required_if:effect,surge|integer|min:0|max:500',
            'title' => 'required|string|max:255',
            'note' => 'nullable|string',
        ]);

        $validated['start_time'] = date('H:i:s', strtotime($validated['start_time']));
        $validated['end_time'] = date('H:i:s', strtotime($validated['end_time']));

        $specialEvent->update($validated);

        return back()->with('success', 'Cập nhật sự kiện thành công!');
    }

    public function destroySpecialEvent($id)
    {
        $specialEvent = FieldSpecialEvent::findOrFail($id);
        $specialEvent->delete();

        return back()->with('success', 'Xóa sự kiện thành công!');
    }
}
