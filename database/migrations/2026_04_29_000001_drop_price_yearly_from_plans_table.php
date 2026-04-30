<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('plans', 'price_yearly')) {
            return;
        }

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('price_yearly');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_yearly', 10, 2)->after('price_monthly');
        });
    }
};
