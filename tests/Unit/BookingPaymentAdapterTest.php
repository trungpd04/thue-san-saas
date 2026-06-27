<?php

namespace Tests\Unit;

use App\Services\Booking\Adapters\SepayBankHubBookingAdapter;
use App\Services\Booking\BookingPaymentManager;
use App\Services\Booking\BookingPaymentAdapter;
use Illuminate\Support\Collection;
use App\Services\SePayService;
use Tests\TestCase;

class BookingPaymentAdapterTest extends TestCase
{
    private function getAdapter(): SepayBankHubBookingAdapter
    {
        $mockSePayService = $this->createMock(SePayService::class);
        return new SepayBankHubBookingAdapter($mockSePayService);
    }
    /**
     * Test: SepayBankHubBookingAdapter implements BookingPaymentAdapter interface
     */
    public function test_sepay_bankhub_adapter_implements_interface(): void
    {
        $adapter = $this->getAdapter();
        $this->assertInstanceOf(BookingPaymentAdapter::class, $adapter);
    }

    /**
     * Test: BookingPaymentManager throws exception when adapter not set
     */
    public function test_manager_throws_when_no_adapter(): void
    {
        $manager = new BookingPaymentManager();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Booking payment adapter not set.');

        $manager->processPayment(collect([]));
    }

    /**
     * Test: BookingPaymentManager throws exception on handleWebhook when adapter not set
     */
    public function test_manager_throws_on_webhook_when_no_adapter(): void
    {
        $manager = new BookingPaymentManager();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Booking payment adapter not set.');

        $manager->handleWebhook([]);
    }

    /**
     * Test: BookingPaymentManager can set and use adapter
     */
    public function test_manager_can_set_adapter(): void
    {
        $manager = new BookingPaymentManager();

        // Tạo mock adapter
        $mockAdapter = $this->createMock(BookingPaymentAdapter::class);
        $mockAdapter->expects($this->once())
            ->method('createTransaction')
            ->willReturn(['success' => true, 'payment_code' => 'BK123']);

        $manager->setAdapter($mockAdapter);
        $result = $manager->processPayment(collect([]));

        $this->assertTrue($result['success']);
        $this->assertEquals('BK123', $result['payment_code']);
    }

    /**
     * Test: SepayBankHubBookingAdapter returns empty bookings error on createTransaction
     */
    public function test_adapter_returns_error_on_empty_bookings(): void
    {
        $adapter = $this->getAdapter();
        $result = $adapter->createTransaction(collect([]));

        $this->assertFalse($result['success']);
        $this->assertEquals('No bookings provided', $result['message']);
    }

    /**
     * Test: SepayBankHubBookingAdapter webhook returns false when no BK code in content
     */
    public function test_adapter_webhook_rejects_no_bk_code(): void
    {
        $adapter = $this->getAdapter();

        $result = $adapter->processWebhook([
            'content' => 'Some random transfer without booking code',
            'transferAmount' => 100000,
        ]);

        $this->assertFalse($result['handled']);
        $this->assertFalse($result['success']);
        $this->assertEquals('No booking payment code found', $result['message']);
    }

    /**
     * Test: SepayBankHubBookingAdapter creates transaction without bank_account returns error
     */
    public function test_adapter_requires_bank_account(): void
    {
        $adapter = $this->getAdapter();

        // Tạo mock bookings
        $booking = $this->createMock(\App\Models\Tenant\Booking::class);
        $booking->method('__get')->willReturnMap([
            ['total_price', 100000],
            ['id', 1],
        ]);

        $bookings = new Collection([$booking]);

        $result = $adapter->createTransaction($bookings, []);

        $this->assertFalse($result['success']);
        $this->assertStringContains('SePay Bank Hub', $result['message']);
    }

    /**
     * Test: Manager supports fluent setAdapter chaining
     */
    public function test_manager_fluent_chaining(): void
    {
        $manager = new BookingPaymentManager();
        $adapter = $this->getAdapter();

        $result = $manager->setAdapter($adapter);

        $this->assertInstanceOf(BookingPaymentManager::class, $result);
    }

    /**
     * Helper: assertStringContains (PHPUnit 10+ compatible)
     */
    private function assertStringContains(string $needle, string $haystack): void
    {
        $this->assertStringContainsString($needle, $haystack);
    }
}
