<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('field_prices', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('field_type_id')->index();
            $table->time('start_time');
            $table->time('end_time');
            $table->string('day_type')->default('weekday');
            $table->decimal('price_per_hour', 10, 2);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onUpdate('cascade')->onDelete('cascade');
            $table->unique(
                ['tenant_id', 'field_type_id', 'start_time', 'end_time', 'day_type'],
                'field_prices_tenant_rule_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_prices');
    }
};
