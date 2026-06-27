<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreStaffRequest;
use App\Http\Requests\Tenant\UpdateStaffRequest;
use App\Contracts\Tenant\IStaffService;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    protected $staffService;

    /**
     * StaffController constructor.
     *
     * @param IStaffService $staffService
     */
    public function __construct(IStaffService $staffService)
    {
        $this->staffService = $staffService;
    }

    /**
     * Display a listing of the staff members.
     *
     * @return Response
     */
    public function index(): Response
    {
        return Inertia::render('Tenant/Staff/Index', [
            'staffMembers' => $this->staffService->getStaffMembers(),
            'maxStaff' => $this->staffService->getMaxStaffLimit(),
            'currentStaffCount' => $this->staffService->getCurrentStaffCount(),
            'planName' => $this->staffService->getPlanName(),
        ]);
    }

    /**
     * Store a newly created staff member in storage.
     *
     * @param StoreStaffRequest $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(StoreStaffRequest $request)
    {
        try {
            $this->staffService->createStaff($request->validated());
            return back()->with('success', 'Thêm nhân viên mới thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update the specified staff member in storage.
     *
     * @param UpdateStaffRequest $request
     * @param mixed $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(UpdateStaffRequest $request, $id)
    {
        try {
            $this->staffService->updateStaff((int) $id, $request->validated());
            return back()->with('success', 'Cập nhật nhân viên thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove the specified staff member from storage.
     *
     * @param mixed $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($id)
    {
        try {
            $this->staffService->deleteStaff((int) $id);
            return back()->with('success', 'Xóa nhân viên thành công!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
