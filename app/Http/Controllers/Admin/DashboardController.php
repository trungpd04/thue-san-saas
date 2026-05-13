<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected $dashboardService;

    // Inject Service vào Controller
    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(): Response
    {
        // Lấy cục data từ Service
        $stats = $this->dashboardService->getGeneralStats();

        // Truyền biến $stats sang file React
        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => $stats
        ]);
    }
}