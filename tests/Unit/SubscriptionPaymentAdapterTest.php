<?php

namespace Tests\Unit;

use App\Services\Subscription\Adapters\MomoAdapter;
use App\Services\Subscription\Adapters\SepayAdapter;
use App\Services\Subscription\PaymentAdapter;
use App\Services\Subscription\PaymentManager;
use Tests\TestCase;

class SubscriptionPaymentAdapterTest extends TestCase
{
    /**
     * Test: SepayAdapter implements PaymentAdapter interface
     */
    public function test_sepay_adapter_implements_interface(): void
    {
        $adapter = new SepayAdapter();
        $this->assertInstanceOf(PaymentAdapter::class, $adapter);
    }

    /**
     * Test: MomoAdapter implements PaymentAdapter interface
     */
    public function test_momo_adapter_implements_interface(): void
    {
        $adapter = new MomoAdapter();
        $this->assertInstanceOf(PaymentAdapter::class, $adapter);
    }

    /**
     * Test: PaymentManager throws exception when adapter not set (processPayment)
     */
    public function test_manager_throws_when_no_adapter_on_process(): void
    {
        $manager = new PaymentManager();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Payment adapter not set.');

        $payment = $this->createMock(\App\Models\SubscriptionPayment::class);
        $manager->processPayment($payment);
    }

    /**
     * Test: PaymentManager throws exception when adapter not set (handleWebhook)
     */
    public function test_manager_throws_when_no_adapter_on_webhook(): void
    {
        $manager = new PaymentManager();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Payment adapter not set.');

        $manager->handleWebhook([]);
    }

    /**
     * Test: PaymentManager can set adapter and delegate processPayment
     */
    public function test_manager_delegates_to_adapter(): void
    {
        $manager = new PaymentManager();

        $mockAdapter = $this->createMock(PaymentAdapter::class);
        $mockAdapter->expects($this->once())
            ->method('createTransaction')
            ->willReturn([
                'success' => true,
                'payment_url' => 'https://qr.sepay.vn/img?test',
                'transaction_ref' => 'TS000001',
                'amount' => 100000,
            ]);

        $payment = $this->createMock(\App\Models\SubscriptionPayment::class);

        $manager->setAdapter($mockAdapter);
        $result = $manager->processPayment($payment);

        $this->assertTrue($result['success']);
        $this->assertEquals('TS000001', $result['transaction_ref']);
    }

    /**
     * Test: PaymentManager can delegate webhook to adapter
     */
    public function test_manager_delegates_webhook_to_adapter(): void
    {
        $manager = new PaymentManager();

        $mockAdapter = $this->createMock(PaymentAdapter::class);
        $mockAdapter->expects($this->once())
            ->method('processWebhook')
            ->willReturn(['success' => true]);

        $manager->setAdapter($mockAdapter);
        $result = $manager->handleWebhook(['content' => 'TS000001', 'transferAmount' => 100000]);

        $this->assertTrue($result['success']);
    }

    /**
     * Test: SepayAdapter webhook rejects when no TS ref in content
     */
    public function test_sepay_webhook_rejects_no_ts_code(): void
    {
        $adapter = new SepayAdapter();

        $result = $adapter->processWebhook([
            'content' => 'Random transfer without subscription code',
            'transferAmount' => 100000,
        ]);

        $this->assertFalse($result['success']);
        $this->assertEquals('No matching reference found in content', $result['message']);
    }

    /**
     * Test: MomoAdapter webhook rejects when no MOMO ref in content
     */
    public function test_momo_webhook_rejects_no_momo_code(): void
    {
        $adapter = new MomoAdapter();

        $result = $adapter->processWebhook([
            'message' => 'Random momo transfer without code',
            'amount' => 100000,
        ]);

        $this->assertFalse($result['success']);
        $this->assertEquals('No matching Momo reference found', $result['message']);
    }

    /**
     * Test: Manager supports fluent setAdapter chaining
     */
    public function test_manager_fluent_chaining(): void
    {
        $manager = new PaymentManager();
        $adapter = new SepayAdapter();

        $result = $manager->setAdapter($adapter);

        $this->assertInstanceOf(PaymentManager::class, $result);
    }
}
