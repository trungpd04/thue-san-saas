<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('subscription_id')->constrained();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('transfer');
            $table->string('status')->default('pending');
            $table->date('billing_period_start');
            $table->date('billing_period_end');
            $table->timestamp('paid_at')->nullable();
            $table->string('transaction_ref')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
