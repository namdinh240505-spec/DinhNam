<?php

// database/migrations/XXXX_add_seat_numbers_to_bookings_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings','seat_numbers')) {
                // JSON cho MySQL 5.7+/MariaDB 10.2+; nếu lỗi thì đổi thành text()
                $table->json('seat_numbers')->nullable()->after('seats');
            }
            if (!Schema::hasColumn('bookings','status')) {
                $table->string('status', 20)->default('pending')->after('seat_numbers');
            }
            if (!Schema::hasColumn('bookings','paid')) {
                $table->boolean('paid')->default(false)->after('status');
            }
        });
    }
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings','seat_numbers')) $table->dropColumn('seat_numbers');
            if (Schema::hasColumn('bookings','status'))       $table->dropColumn('status');
            if (Schema::hasColumn('bookings','paid'))         $table->dropColumn('paid');
        });
    }
};

