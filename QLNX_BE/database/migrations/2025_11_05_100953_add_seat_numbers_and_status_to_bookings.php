<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'seat_numbers')) {
                $table->json('seat_numbers')->nullable()->after('seats');
            }
            if (!Schema::hasColumn('bookings', 'status')) {
                $table->string('status')->default('pending')->after('seat_numbers'); // pending|confirmed|cancelled
            }
        });
    }

    public function down(): void {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'seat_numbers')) $table->dropColumn('seat_numbers');
            if (Schema::hasColumn('bookings', 'status'))       $table->dropColumn('status');
        });
    }
};
