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
            $table->foreignId('field_id')->constrained()->cascadeOnDelete();
            $table->foreignId('time_slot_id')->constrained()->cascadeOnDelete();
            $table->string('day_type')->default('weekday');
            $table->decimal('price', 10, 2);
            $table->timestamps();

            $table->unique(['field_id', 'time_slot_id', 'day_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_prices');
    }
};
