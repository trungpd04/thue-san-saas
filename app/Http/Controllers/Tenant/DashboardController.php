<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Tenant\DashboardService;
use Illuminate\Http\Request;
use Carbon\Carbon;
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

    public function export(Request $request)
    {
        $year = (int) $request->query('year', Carbon::now()->year);
        $month = $request->query('month'); // can be null for full year
        
        $tenant = tenant();
        $this->dashboardService->setTenantId($tenant->id);

        if ($month) {
            $month = (int) $month;
            $chartData = $this->dashboardService->getChartDataForMonth($year, $month);
            $title = "Báo Cáo Doanh Thu Tháng {$month}/{$year}";
            $filename = "doanh_thu_thang_{$month}_{$year}.xls";
            $col1 = 'Ngày';
        } else {
            $chartData = $this->dashboardService->getChartDataForYear($year);
            $title = "Báo Cáo Doanh Thu Năm {$year}";
            $filename = "doanh_thu_nam_{$year}.xls";
            $col1 = 'Tháng';
        }

        $html = '
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                th { background-color: #1890ff; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 10px; text-align: center; }
                td { border: 1px solid #000000; padding: 8px; text-align: center; }
                .title { font-size: 20px; font-weight: bold; color: #1890ff; text-align: center; border: none !important; }
                .sum-row td { font-weight: bold; background-color: #f5f5f5; }
                .money { mso-number-format:"\#\,\#\#0"; text-align: right; }
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <td colspan="3" class="title" style="height: 40px; vertical-align: middle;">' . mb_strtoupper($title, 'UTF-8') . '</td>
                </tr>
                <tr>
                    <td colspan="3" style="border: none; height: 20px;"></td>
                </tr>
                <tr>
                    <th style="width: 150px;">' . $col1 . '</th>
                    <th style="width: 150px;">Số Lịch Đặt</th>
                    <th style="width: 200px;">Doanh Thu (VND)</th>
                </tr>';

        $totalLichDat = 0;
        $totalDoanhThu = 0;

        foreach ($chartData as $row) {
            $totalLichDat += $row['lich_dat'];
            $totalDoanhThu += $row['doanh_thu'];
            
            $html .= '<tr>
                <td>' . $row['name'] . '</td>
                <td>' . $row['lich_dat'] . '</td>
                <td class="money">' . $row['doanh_thu'] . '</td>
            </tr>';
        }

        // Dòng tổng cộng
        $html .= '<tr class="sum-row">
            <td style="text-align: right;">Tổng Cộng:</td>
            <td>' . $totalLichDat . '</td>
            <td class="money">' . $totalDoanhThu . '</td>
        </tr>';

        $html .= '
            </table>
        </body>
        </html>';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Pragma', 'no-cache')
            ->header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
            ->header('Expires', '0');
    }
}