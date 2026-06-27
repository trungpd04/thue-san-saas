<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Tenant\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index()
    {
        $tenant = tenant();
        $tenantId = $tenant->id;

        $this->dashboardService->setTenantId($tenantId);

        $stats = $this->dashboardService->getStats();
        $stats['current_plan'] = $this->dashboardService->getPlanName($tenant);

        $chartDataCurrentYear = $this->dashboardService->getChartDataForYear($stats['current_year']);
        $chartDataLastYear = $this->dashboardService->getChartDataForYear($stats['last_year']);

        return Inertia::render('Tenant/TenantDashboard', [
            'stats' => $stats,
            'chartDataCurrentYear' => $chartDataCurrentYear,
            'chartDataLastYear' => $chartDataLastYear,
        ]);
    }
}