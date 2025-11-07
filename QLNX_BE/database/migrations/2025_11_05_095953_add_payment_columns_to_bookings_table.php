<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('bookings', function (Blueprint $table) {
            // Nếu chưa có các cột này thì thêm mới
            if (!Schema::hasColumn('bookings','payment_status')) {
                $table->string('payment_status')->default('unpaid'); // unpaid | paid | failed
            }
            if (!Schema::hasColumn('bookings','payment_method')) {
                $table->string('payment_method')->nullable();
            }
            if (!Schema::hasColumn('bookings','payment_txn_id')) {
                $table->string('payment_txn_id')->nullable();
            }
            if (!Schema::hasColumn('bookings','amount_paid')) {
                $table->unsignedBigInteger('amount_paid')->default(0);
            }
            if (!Schema::hasColumn('bookings','paid_at')) {
                $table->timestamp('paid_at')->nullable();
            }
        });
    }

    public function down(): void {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_status','payment_method','payment_txn_id','amount_paid','paid_at']);
        });
    }
};
