<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('field_special_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('field_id')->nullable()->constrained()->nullOnDelete();
            $table->date('event_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('effect');
            $table->unsignedTinyInteger('surge_percent')->nullable();
            $table->string('title')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onUpdate('cascade')->onDelete('cascade');
            $table->index(['field_id', 'event_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_special_events');
    }
};
