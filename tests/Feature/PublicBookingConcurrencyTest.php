<?php

namespace Tests\Feature;

use App\Models\FieldType;
use App\Models\Tenant;
use App\Models\Tenant\Booking;
use App\Models\Tenant\Field;
use App\Services\PublicFieldService;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\Concurrency;
use Tests\TestCase;

class PublicBookingConcurrencyTest extends TestCase
{
    // Sử dụng DatabaseTruncation thay vì RefreshDatabase 
    // để dữ liệu được commit thật xuống DB, giúp các process con nhìn thấy được.
    use DatabaseTruncation;

    public function test_real_concurrency_prevents_overlapping_bookings(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-test-concurrent',
            'name' => 'Test Tenant',
            'slug' => 'test-tenant-concurrent',
            'is_active' => true,
        ]);

        $fieldType = FieldType::create([
            'name' => 'Sân bóng đá 5 người',
            'sport' => 'football',
            'is_active' => true,
        ]);

        $field = Field::create([
            'tenant_id' => $tenant->id,
            'field_type_id' => $fieldType->id,
            'name' => 'Sân 1',
            'is_active' => true,
        ]);

        $payload1 = [
            'date' => '2026-05-10',
            'customer_name' => 'Nguyen Van A',
            'customer_phone' => '0900000001',
            'total_price' => 100000,
            'pricing_breakdown' => [
                [
                    'field_id' => $field->id,
                    'start_time' => '18:00',
                    'end_time' => '19:00',
                    'price' => 100000,
                ],
            ],
        ];

        $payload2 = [
            'date' => '2026-05-10',
            'customer_name' => 'Tran Van B',
            'customer_phone' => '0900000002',
            'total_price' => 100000,
            'pricing_breakdown' => [
                [
                    'field_id' => $field->id,
                    'start_time' => '18:00',
                    'end_time' => '19:00',
                    'price' => 100000,
                ],
            ],
        ];

        $tenantId = $tenant->id;

        // Chạy 2 process song song thực sự bằng Laravel Concurrency
        $results = Concurrency::run([
            function () use ($tenantId, $payload1) {
                try {
                    tenancy()->initialize($tenantId);
                    app(PublicFieldService::class)->storeBooking($tenantId, $payload1);
                    return 'success';
                } catch (\Exception $e) {
                    return 'error: ' . $e->getMessage();
                }
            },
            function () use ($tenantId, $payload2) {
                try {
                    tenancy()->initialize($tenantId);
                    app(PublicFieldService::class)->storeBooking($tenantId, $payload2);
                    return 'success';
                } catch (\Exception $e) {
                    return 'error: ' . $e->getMessage();
                }
            }
        ]);

        // Đảm bảo có 1 request thành công và 1 request thất bại do overlap
        $this->assertContains('success', $results);
        $this->assertContains('error: Sân hiện đang có người thao tác, vui lòng chọn slot khác hoặc quay lại sau.', $results);

        // Kiểm tra lại trong DB chỉ có đúng 1 booking được tạo ra thành công
        $this->assertSame(1, Booking::query()
            ->where('field_id', $field->id)
            ->whereDate('booking_date', '2026-05-10')
            ->where('start_time', '18:00:00')
            ->where('end_time', '19:00:00')
            ->count());
    }
}
