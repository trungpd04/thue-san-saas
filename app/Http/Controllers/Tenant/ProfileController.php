<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit()
    {
        $tenant = tenant();
        
        return Inertia::render('Tenant/Settings/Profile', [
            'tenant' => $tenant
        ]);
    }

    public function update(Request $request)
    {
        $tenant = tenant();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Cập nhật thông tin trung tâm thành công!');
    }
}
