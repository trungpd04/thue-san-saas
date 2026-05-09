<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Field;
use App\Http\Requests\Tenant\SaveFieldRequest;
use App\Services\Tenant\FieldService;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class FieldController extends Controller
{
    public function __construct(
        protected FieldService $fieldService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Tenant/Fields/Index', [
            'fields' => $this->fieldService->getAllFields(),
            'fieldTypes' => $this->fieldService->getActiveFieldTypes(),
        ]);
    }

    public function store(SaveFieldRequest $request): RedirectResponse
    {
        $this->fieldService->createField($request->validated());

        return redirect()->back()->with('success', 'Thêm sân mới thành công!');
    }

    public function update(SaveFieldRequest $request, Field $field): RedirectResponse
    {
        $this->fieldService->updateField($field, $request->validated());

        return redirect()->back()->with('success', 'Cập nhật thông tin sân thành công!');
    }

    public function destroy(Field $field): RedirectResponse
    {
        $this->fieldService->deleteField($field);

        return redirect()->back()->with('success', 'Đã xóa sân khỏi hệ thống!');
    }
}