<?php

// database/migrations/XXXX_add_code_to_bookings_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings','code')) {
                $table->string('code', 32)->unique()->after('id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings','code')) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            }
        });
    }
};
